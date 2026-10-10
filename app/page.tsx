"use client";

import { useMiniApp } from "@/context";
import { UserRole } from "./generated/prisma/enums";
import { HomePage } from "./home/home-page";

const Home = () => {
  const { user } = useMiniApp();
  return <HomePage isAdmin={user?.role === UserRole.ADMIN} />;
};

export default Home;
