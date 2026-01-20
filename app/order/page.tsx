"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Alert, LoadingOverlay } from "@mantine/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { Routes } from "@/config";
import { Urgency } from "@/types";
import { UploadError } from "@/utils";
import { useTelegram } from "@/context";
import { BackButton } from "@/components";
import { useCreateOrder } from "@/api/orders/hooks";

import { Step } from "./types";
import { CopyDetails } from "./copy-details";
import { AdditionalInfo } from "./additional-info";
import { prepareOrderWithUploads } from "./helpers";
import { orderSchema, OrderFormData, defaultPrintJob } from "./config";

export default function Order() {
  const router = useRouter();
  const { user } = useTelegram();
  const [step, setStep] = useState<Step>(Step.CopyDetails);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);

  const { mutateAsync, isPending } = useCreateOrder();

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
      setUploadErrors([]);
      setIsUploading(true);

      const result = await prepareOrderWithUploads(data);

      if (!result.success) {
        setUploadErrors(result.errors);
        return;
      }

      const response = await mutateAsync(result.data);
      if (response.id) {
        router.push(Routes.SuccessOrder.replace(":id", String(response.id)));
      }
    } catch (error) {
      console.error("Ошибка заказа:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <LoadingOverlay visible={isPending || isUploading} />
      <div className="flex flex-col min-h-dvh p-4">
        {isFirstStep && (
          <div>
            <BackButton url={Routes.Home} className="mb-2" />
          </div>
        )}

        {uploadErrors.length > 0 && (
          <Alert
            icon={<AlertCircle size={16} />}
            color="red"
            className="mb-4"
            title="Ошибки загрузки"
          >
            <ul className="list-disc list-inside">
              {uploadErrors.map((error, index) => (
                <li key={index}>
                  <strong>{error.fileName}</strong>: {error.error}
                </li>
              ))}
            </ul>
          </Alert>
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
