"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { Routes } from "@/config";
import { Urgency } from "@/types";
import { useTelegram } from "@/context";
import { BackButton } from "@/components";
import { useUploadThing } from "@/lib/uploadthing";
import { useCreateOrder } from "@/api/orders/hooks";

import { Step, ProcessStage } from "./types";
import { CopyDetails } from "./copy-details";
import { OrderLoader } from "./order-loader";
import { AdditionalInfo } from "./additional-info";
import { prepareOrderWithUploads } from "./helpers";
import { orderSchema, OrderFormData, defaultPrintJob } from "./config";

export default function Order() {
  const router = useRouter();
  const { user } = useTelegram();
  const [step, setStep] = useState<Step>(Step.CopyDetails);
  const [stage, setStage] = useState<ProcessStage>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const { mutateAsync } = useCreateOrder();

  const { startUpload } = useUploadThing("fileUploader", {
    onUploadProgress: (p) => {
      setUploadProgress(p);
    },
    onClientUploadComplete: () => {
      setUploadProgress(100);
      setStage("creating");
    },
    onUploadError: (error) => {
      console.error("Ошибка загрузки файлов:", error);
      toast.error("Не удалось загрузить файлы. Попробуйте еще раз.");
      setStage("idle");
    },
  });

  const methods = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      comment: "",
      deadlineAt: "",
      telegramId: user?.id,
      urgency: Urgency.ASAP,
      printJobs: [defaultPrintJob],
    },
  });

  const { handleSubmit } = methods;

  const isFirstStep = step === Step.CopyDetails;
  const isLastStep = step === Step.AdditionalInfo;

  const onSubmit = async (data: OrderFormData) => {
    if (isFirstStep) {
      setStep(Step.AdditionalInfo);
      return;
    }

    try {
      setStage("uploading");
      setUploadProgress(0);

      const result = await prepareOrderWithUploads(data, startUpload);

      if (!result?.success) {
        return;
      }

      setStage("creating");
      const response = await mutateAsync(result.data);
      if (response.id) {
        router.push(Routes.SuccessOrder.replace(":id", String(response.id)));
      }
    } catch (error) {
      console.error("Ошибка заказа:", error);
    } finally {
      setStage("idle");
    }
  };

  return (
    <>
      <OrderLoader
        stage={stage}
        progress={uploadProgress}
        visible={stage !== "idle"}
      />

      <div className="flex flex-col min-h-dvh p-4">
        {isFirstStep && (
          <div>
            <BackButton url={Routes.Home} className="mb-2" />
          </div>
        )}

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1"
          >
            {isFirstStep && <CopyDetails />}
            {isLastStep && (
              <AdditionalInfo onBack={() => setStep(Step.CopyDetails)} />
            )}
          </form>
        </FormProvider>
      </div>
    </>
  );
}
