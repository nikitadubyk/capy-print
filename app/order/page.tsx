"use client";

import { clearClientSession, getSessionHeaders } from "@/store/api/session";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Routes } from "@/config/routes";
import { useUploadThing } from "@/lib/uploadthing";
import { useCreateOrder } from "@/store/api/orders/hooks";

import { ProcessStage } from "./types";
import { OrderForm } from "./order-form";
import { OrderLoader } from "./order-loader";
import { getErrorDiagnostics } from "@/lib/error-diagnostics";
import { prepareOrderWithUploads } from "./helpers";
import type { OrderFormData } from "./config";

const Order = () => {
  const router = useRouter();

  const [stage, setStage] = useState<ProcessStage>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitting = useRef(false);

  const { mutateAsync } = useCreateOrder();

  const { startUpload } = useUploadThing("fileUploader", {
    headers: getSessionHeaders,
    onUploadProgress: (p) => {
      if (!submitting.current) return;
      setUploadProgress(p);
    },
    onUploadError: (error) => {
      if (error.code === "FORBIDDEN") clearClientSession();
      // UploadThing otherwise resolves startUpload with undefined after this callback.
      throw error;
    },
  });

  const onSubmit = async (data: OrderFormData) => {
    if (submitting.current) return;
    submitting.current = true;
    setSubmitError(null);
    let phase = "uploading";
    try {
      setStage("uploading");
      setUploadProgress(0);
      console.info("[Capy Print][order] Загрузка файлов");
      const payload = await prepareOrderWithUploads(data, startUpload);
      phase = "creating";
      setStage("creating");
      console.info("[Capy Print][order] Создание заказа");
      const response = await mutateAsync(payload);
      if (!response.id) throw new Error("Сервер не вернул номер заказа");
      console.info("[Capy Print][order] Заказ создан, открываем экран успеха", {
        orderId: response.id,
      });
      router.push(Routes.SuccessOrder.replace(":id", String(response.id)));
    } catch (error) {
      setSubmitError("Не удалось оформить заказ. Попробуйте ещё раз.");
      console.error("[Capy Print][order] Ошибка оформления", {
        phase,
        ...getErrorDiagnostics(error),
      });
      setStage("idle");
      window.scrollTo({ top: 0, behavior: "instant" });
      submitting.current = false;
    }
  };

  return (
    <>
      <OrderLoader
        stage={stage}
        progress={uploadProgress}
        visible={stage !== "idle"}
      />

      <OrderForm onSubmit={onSubmit} submitError={submitError} />
    </>
  );
};

export default Order;
