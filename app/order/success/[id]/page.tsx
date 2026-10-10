"use client";

import { useParams } from "next/navigation";
import { useMiniApp } from "@/context";
import { OrderSuccessPage } from "../success-page";

const Success = () => {
  const { id } = useParams<{ id: string }>();
  const { platform } = useMiniApp();
  return <OrderSuccessPage id={id} platform={platform} />;
};

export default Success;
