import ServiceAppointment from "../models/serviceAppointment.js";
import Service from "../models/Service.js";
import Stripe from "stripe";
import { getAuth } from "@clerk/express";
import e from "express";

const stripeKey = process.env.STRIPE_SECRET_KEY || null;
const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2022-11-15" })
  : null;

// HELPER FUNCTIONS
// This function will return a finite number
const safeNumber = (val) => {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};

// This function will parse the time and return AM : PM
function parseTimeString(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const t = timeStr.trim();
  const m = t.match(/([0-9]{1,2}):?([0-9]{0,2})\s*(AM|PM|am|pm)?/);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  let mm = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = (m[3] || "").toUpperCase();
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  if (ampm) {
    if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
    return { hour: hh, minute: mm, ampm };
  }

  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  if (hh === 0) return { hour: 12, minute: mm, ampm: "AM" };
  if (hh === 12) return { hour: 12, minute: mm, ampm: "PM" };
  if (hh > 12) return { hour: hh - 12, minute: mm, ampm: "PM" };
  return { hour: hh, minute: mm, ampm: "AM" };
}

// This function will create the frontend url
const buildFrontendBase = (req) => {
  const env = process.env.FRONTEND_URL;
  if (env) return env.replace(/\/$/, "");
  const origin = req.get("origin") || req.get("referer") || null;
  return origin ? origin.replace(/\/$/, "") : null;
};

// This function will get the user from clerk and return the user details
function resolveClerkUserId(req) {
  try {
    const auth = req.auth || {};
    const candidate =
      auth?.userId || auth?.user_id || auth?.user?.id || req.user?.id || null;
    if (candidate) return candidate;
    try {
      const serverAuth = getAuth ? getAuth(req) : null;
      return serverAuth?.userId || null;
    } catch (e) {
      return null;
    }
  } catch (e) {
    return null;
  }
}

// To create a serviceAppointment
export const createServiceAppointment = async (req, res) => {
  try {
    const body = req.body || {};
    const clerkUserId = resolveClerkUserId(req);
    if (!clerkUserId)
      return res.status(401).json({
        success: false,
        message: "Authentication is required to create a service appointment",
      });
    const {
      serviceId,
      serviceName: serviceNameFromBody,
      patientName,
      mobile,
      age,
      gender,
      date,
      time,
      hour,
      minute,
      ampm,
      paymentMethod = "Online",
      amount: amountFromBody,
      fees: feesFromBody,
      email,
      meta = {},
      notes = "",
      serviceImageUrl: serviceImageUrlFromBody,
      serviceImagePublicId: serviceImagePublicIdFromBody,
    } = body;

    // Basic validation
    if (!serviceId)
      return res
        .status(400)
        .json({ success: false, message: "serviceId is required" });
    if (!patientName || !String(patientName).trim())
      return res
        .status(400)
        .json({ success: false, message: "patientName is required" });
    if (!mobile || !String(mobile).trim())
      return res
        .status(400)
        .json({ success: false, message: "mobile is required" });
    if (!date || !String(date).trim())
      return res
        .status(400)
        .json({ success: false, message: "date is required (YYYY-MM-DD)" });

    const numericAmount = safeNumber(amountFromBody ?? feesFromBody ?? 0);
    if (numericAmount === null || numericAmount < 0)
      return res.status(400).json({
        success: false,
        message: "amount/fees must be a valid number",
      });

    // For time slots
    let finalHour = hour !== undefined ? safeNumber(hour) : null;
    let finalMinute = minute !== undefined ? safeNumber(minute) : null;
    let finalAmpm = ampm || null;

    if (time && (finalHour === null || finalHour === undefined)) {
      const parsed = parseTimeString(time);
      if (!parsed)
        return res
          .status(400)
          .json({ success: false, message: "time string couldn't be parsed" });
      finalHour = parsed.hour;
      finalMinute = parsed.minute;
      finalAmpm = parsed.ampm;
    }

    if (
      finalHour === null ||
      finalMinute === null ||
      (finalAmpm !== "AM" && finalAmpm !== "PM")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Time missing or invalid — provide time string or hour, minute and ampm.",
      });
    }

    // DUPLICATE BOOKING CHECK
    try {
      const existing = await ServiceAppointment.findOne({
        serviceId: String(serviceId),
        createdBy: clerkUserId,
        date: String(date),
        hour: Number(finalHour),
        minute: Number(finalMinute),
        ampm: finalAmpm,
        status: { $ne: "Canceled" },
      }).lean();
      if (existing)
        return res.status(409).json({
          success: false,
          message:
            "You already have a booking for this service at the selected date and time.",
        });
    } catch (chkErr) {
      console.warn("Duplicate booking check failed:", chkErr);
    }

    // Fetch service snapshot (non-fatal)
    let svc = null;
    try {
      svc = await Service.findById(serviceId).lean();
    } catch (e) {
      console.warn("Service lookup failed:", e?.message || e);
    }

    let resolvedServiceName =
      serviceNameFromBody || (svc && (svc.name || svc.title)) || "Service";
    const svcImageUrlFromDB =
      svc &&
      (String(
        svc.imageUrl ||
          svc.image ||
          svc.image?.url ||
          svc.profileImage?.url ||
          "",
      ).trim() ||
        "");
    const svcImagePublicIdFromDB =
      svc &&
      (String(
        svc.imagePublicId ||
          svc.image?.publicId ||
          svc.profileImage?.publicId ||
          "",
      ).trim() ||
        "");
    const finalServiceImageUrl =
      svcImageUrlFromDB && svcImageUrlFromDB.length
        ? svcImageUrlFromDB
        : (serviceImageUrlFromBody && String(serviceImageUrlFromBody).trim()) ||
          "";
    const finalServiceImagePublicId =
      svcImagePublicIdFromDB && svcImagePublicIdFromDB.length
        ? svcImagePublicIdFromDB
        : (serviceImagePublicIdFromBody &&
            String(serviceImagePublicIdFromBody).trim()) ||
          "";

    const base = {
      serviceId,
      serviceName: resolvedServiceName,
      serviceImage: {
        url: finalServiceImageUrl,
        publicId: finalServiceImagePublicId,
      },
      patientName: String(patientName).trim(),
      mobile: String(mobile).trim(),
      age: age ? Number(age) : undefined,
      gender: gender || "",
      date: String(date),
      hour: Number(finalHour),
      minute: Number(finalMinute),
      ampm: finalAmpm,
      fees: numericAmount,
      createdBy: clerkUserId,
      notes: notes || "",
    };

    // Free appointment
    if (numericAmount === 0) {
      const created = await ServiceAppointment.create({
        ...base,
        status: "Pending",
        payment: {
          method: "Cash",
          status: "Pending",
          amount: 0,
          paidAt: new Date(),
        },
      });
      return res.status(201).json({ success: true, appointment: created });
    }

    // Cash booking
    if (paymentMethod === "Cash") {
      const created = await ServiceAppointment.create({
        ...base,
        status: "Pending",
        payment: {
          method: "Cash",
          status: "Pending",
          amount: numericAmount,
          meta,
        },
      });
      return res
        .status(201)
        .json({ success: true, appointment: created, checkoutUrl: null });
    }

    // Online booking (Stripe)
    if (!stripe)
      return res
        .status(500)
        .json({ success: false, message: "Stripe not configured on server" });
    const frontendBase = buildFrontendBase(req);
    if (!frontendBase)
      return res.status(500).json({
        success: false,
        message:
          "Frontend base URL not available. Set FRONTEND_URL or provide Origin header.",
      });

    const successUrl = `${frontendBase}/service-appointment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendBase}/service-appointment/cancel`;

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: email ? String(email) : undefined,
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: `Service: ${String(resolvedServiceName).slice(0, 60)}`,
                description: `Appointment on ${base.date} ${base.hour}:${String(base.minute).padStart(2, "0")} ${base.ampm}`,
              },
              unit_amount: Math.round(numericAmount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          serviceId: String(serviceId),
          serviceName: String(resolvedServiceName).slice(0, 200),
          patientName: base.patientName,
          mobile: base.mobile,
          clerkUserId: base.createdBy || "",
          serviceImageUrl: finalServiceImageUrl
            ? String(finalServiceImageUrl).slice(0, 200)
            : "",
        },
      });
    } catch (stripeErr) {
      console.error("Stripe create session error:", stripeErr);
      const message =
        stripeErr?.raw?.message || stripeErr?.message || "Stripe error";
      return res.status(502).json({
        success: false,
        message: `Payment provider error: ${message}`,
      });
    }

    try {
      const created = await ServiceAppointment.create({
        ...base,
        status: "Confirmed",
        payment: {
          method: "Online",
          status: "Pending",
          amount: numericAmount,
          sessionId: session.id || "",
        },
      });
      return res.status(201).json({
        success: true,
        appointment: created,
        checkoutUrl: session.url || null,
      });
    } catch (dbErr) {
      console.error(
        "DB error saving service appointment after stripe session:",
        dbErr,
      );
      return res.status(500).json({
        success: false,
        message: "Failed to create appointment record",
      });
    }
  } catch (err) {
    console.error("createServiceAppointment unexpected:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// To confirm the servicePayment
export const confirmServicePayment = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id)
      return res.status(400).json({
        success: false,
        message: "Session Id is required",
      });
    if (!stripe)
      return res
        .status(500)
        .json({ success: false, message: "Stripe is not configured" });

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
    } catch (err) {
      console.error("Stripe Error:", err);
      return res.status(404).json({
        success: false,
        message: "Stripe session not found",
      });
    }

    if (!session)
      return res.status(404).json({
        success: false,
        message: "Invalid session",
      });
    if (session.payment_status !== "paid")
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });

    let appt = await ServiceAppointment.findOneAndUpdate(
      { "payment.sessionId": session_id },
      {
        $set: {
          "payment.status": "Confirmed",
          "payment.providerId": session.payment_intent || "",
          "payment.paidAt": new Date(),
          status: "Confirmed",
        },
      },
      { new: true },
    );

    if (!appt && session.metadata?.appointmentId) {
      appt = await ServiceAppointment.findOneAndUpdate(
        { _id: session.metadata.appointmentId },
        {
          $set: {
            "payment.status": "Confirmed",
            "payment.providerId": session.payment_intent || "",
            "payment.paidAt": new Date(),
            status: "Confirmed",
          },
        },
        { new: true },
      );
    }

    if (!appt)
      return res
        .status(404)
        .json({ success: false, message: "Service appointment not found" });
    return res.json({ success: true, appointment: appt });
  } catch (err) {
    console.error("confirmServicePayment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// To getServiceAppointments
export const getServiceAppointments = async (req, res) => {
  try {
    const {
      serviceId,
      mobile,
      status,
      page: pageRaw = 1,
      limit: limitRaw = 50,
      search = "",
    } = req.query;
    const limit = Math.min(200, Math.max(1, parseInt(limitRaw, 10) || 50));
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const skip = (page - 1) * limit;

    // For filter
    const filter = {};
    if (serviceId) filter.serviceId = serviceId;
    if (mobile) filter.mobile = mobile;
    if (status) filter.status = status;
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ patientName: re }, { mobile: re }, { notes: re }];
    }

    const appointments = await ServiceAppointment.find(filter)
      .populate("serviceId", "name image imageUrl imageSmall")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await ServiceAppointment.countDocuments(filter);
    return res.json({
      success: true,
      appointments,
      meta: { page, limit, total, count: appointments.length },
    });
  } catch (err) {
    console.error("getServiceAppointments error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// To getServiceAppointmentById
export const getServiceAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await ServiceAppointment.findById(id).lean();

    if (!appt)
      return res.status(404).json({
        success: false,
        message: "Not found the appointment",
      });
    return res.json({ success: true, appointment: appt });
  } catch (err) {
    console.error("getServiceAppointmentById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// To update an appointment
export const updateServiceAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const updates = {};

    // First check whether fill if yes then update the field
    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.payment !== undefined) updates.payment = body.payment;
    if (body["payment.status"] !== undefined)
      updates["payment.status"] = body["payment.status"];

    if (body.rescheduledTo) {
      const { date, time } = body.rescheduledTo || {};
      updates.rescheduledTo = {};
      if (date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
          return res.status(400).json({
            success: false,
            message: "rescheduledTo.date must be YYYY-MM-DD",
          });
        updates.rescheduledTo.date = date;
        updates.date = date;
      }
      if (time) {
        updates.rescheduledTo.time = String(time);
        const parsed = parseTimeString(String(time));
        if (!parsed)
          return res.status(400).json({
            success: false,
            message: "rescheduledTo.time couldn't be parsed",
          });
        updates.hour = parsed.hour;
        updates.minute = parsed.minute;
        updates.ampm = parsed.ampm;
        updates.time = `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")} ${parsed.ampm}`;
      }
      if (!body.status) updates.status = "Rescheduled";
    }

    if (updates.payment) {
      const method = updates.payment.method || updates.payment?.method;
      if (method && String(method).toLowerCase() === "online")
        updates.status = updates.status || "Confirmed";
      if (updates.payment.status && updates.payment.status === "Confirmed") {
        updates.status = "Confirmed";
        if (updates.payment.paidAt === undefined)
          updates.payment.paidAt = new Date();
      }
    }

    const updated = await ServiceAppointment.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updated)
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    return res.json({ success: true, date: updated });
  } catch (err) {
    console.error("updateServiceAppointment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// To cancel the serviceAppointment
export const cancelServiceAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await ServiceAppointment.findById(id);
    if (!appt)
      return res.status(404).json({ success: false, message: "Not found" });
    if (appt.status === "Completed")
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed appointment",
      });

    appt.status = "Canceled";
    if (appt.payment)
      appt.payment.status =
        appt.payment.status === "Confirmed" ? "Canceled" : "Pending";
    await appt.save();
    return res.json({ success: true, data: appt });
  } catch (err) {
    console.error("cancelServiceAppointment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// To get the statistics
export const getServiceAppointmentStats = async (req, res) => {
  try {
    const services = await Service.aggregate([
      {
        $lookup: {
          from: "serviceappointments",
          localField: "_id",
          foreignField: "serviceId",
          as: "appointments",
        },
      },
      {
        $addFields: {
          totalAppointments: { $size: "$appointments" },
          completed: {
            $size: {
              $filter: {
                input: "$appointments",
                as: "a",
                cond: { $eq: ["$$a.status", "Completed"] },
              },
            },
          },
          canceled: {
            $size: {
              $filter: {
                input: "$appointments",
                as: "a",
                cond: { $eq: ["$$a.status", "Canceled"] },
              },
            },
          },
        },
      },
      { $addFields: { earning: { $multiply: ["$completed", "$price"] } } },
      {
        $project: {
          name: 1,
          price: 1,
          image: "$imageUrl",
          totalAppointments: 1,
          completed: 1,
          canceled: 1,
          earning: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]); // It will give you total appointment, complete appt
    // Cancel appt and total earning done by them
    return res.json({
      success: true,
      services,
      totalServices: services.length,
    });
  } catch (err) {
    console.error("getServiceAppointmentStats error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// To get appointment for the patient
export const getServiceAppointmentsByPatient = async (req, res) => {
  try {
    const clerkUserId = resolveClerkUserId(req);
    const { createdBy, mobile } = req.query;
    const resolvedCreatedBy = createdBy || clerkUserId || null;
    if (!resolvedCreatedBy && !mobile)
      return res.json({
        success: true,
        data: [],
      });

    const filter = {};
    if (resolvedCreatedBy) filter.createdBy = resolvedCreatedBy;
    if (mobile) filter.mobile = mobile;

    const list = await ServiceAppointment.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      success: true,
      data: list,
    });
  } catch (err) {
    console.error("getServiceAppointmentsByPatient error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default {
  createServiceAppointment,
  confirmServicePayment,
  getServiceAppointments,
  getServiceAppointmentById,
  updateServiceAppointment,
  cancelServiceAppointment,
  getServiceAppointmentStats,
  getServiceAppointmentsByPatient,
};