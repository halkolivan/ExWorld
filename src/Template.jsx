import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Template() {
  const [selectedSport, setSelectedSport] = useState("Skate");

  return (
    <>
      <Header />
      <Outlet context={{ selectedSport }} />
      <Footer selectedSport={selectedSport} onSportChange={setSelectedSport} />
    </>
  );
}
