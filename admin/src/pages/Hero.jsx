import React from "react";
import Navbar from "../components/Navbar";
import { heroStyles } from "../assets/dummyStyles";
import logoImg from "../assets/logo.png";

const Hero = ({ role = "admin", userName = "Doctor" }) => {
  const isDoctor = role === "doctor";

  return (
    <div className={heroStyles.container}>
      <Navbar />
      <main className={heroStyles.mainContainer}>
        <section className={heroStyles.section}>
          <div className={heroStyles.decorativeBg.container}>
            <div className={heroStyles.decorativeBg.blurBackground}>
              <div className={heroStyles.decorativeBg.blurShape}></div>
            </div>

            <div className={heroStyles.contentBox}>
              <div className={heroStyles.logoContainer}>
                <img src={logoImg} alt="logo" className={heroStyles.logo} />
              </div>

              <h1 className={heroStyles.heading}>
                {isDoctor
                  ? `Welcome, Dr. ${userName}`
                  : "WELCOME TO MEDICARE ADMIN PANEL"}
              </h1>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Hero;
