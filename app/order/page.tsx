"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { Alert, LoadingOverlay } from "@mantine/core";
import { zodResolver } from "@hookform/resolvers/zod";

import { Routes } from "@/config";
import { Urgency } from "@/types";
import { useTelegram } from "@/context";
import { BackButton } from "@/components";
import { useCreateOrder } from "@/api/orders/hooks";
import { UploadedFile, UploadError, uploadFiles } from "@/utils";

import { Step } from "./types";
import { CopyDetails } from "./copy-details";
import { AdditionalInfo } from "./additional-info";
import { orderSchema, OrderFormData, defaultPrintJob } from "./config";

export default function Order() {
  const { user } = useTelegram();
  const [step, setStep] = useState<Step>(Step.CopyDetails);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);

  const { mutate, isPending } = useCreateOrder();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      comment: "",
      deadlineAt: "",
      telegramId: user?.id,
      urgency: Urgency.ASAP,
      printJobs: [defaultPrintJob],
    },
  });

  const isFirstStep = step === Step.CopyDetails;
  const isLastStep = step === Step.AdditionalInfo;

  const onSubmit = async (data: OrderFormData) => {
    if (isFirstStep) {
      setStep(Step.AdditionalInfo);
      return;
    }

    try {
      setUploadErrors([]);

      const filesToUpload: File[] = [];

      data.printJobs.forEach((job) => {
        job.files.forEach((file) => {
          if (file instanceof File) {
            filesToUpload.push(file);
          }
        });
      });

      setIsUploading(true);
      const uploadResult = await uploadFiles(filesToUpload);
      setIsUploading(false);

      if (uploadResult.errors && uploadResult.errors.length > 0) {
        setUploadErrors(uploadResult.errors);
        return;
      }

      let uploadedIndex = 0;
      const orderData = {
        ...data,
        printJobs: data.printJobs.map((job) => ({
          ...job,
          files: job.files.map((file) => {
            if (file instanceof File) {
              return uploadResult.uploaded[uploadedIndex++];
            }
            return file as UploadedFile;
          }),
        })),
      };

      await mutate(orderData);
    } catch (error) {
      console.error("Ошибка:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <LoadingOverlay visible={isPending || isUploading} />
      <div className="p-4 m-auto h-full">
        {isFirstStep && <BackButton url={Routes.Home} className="mb-2" />}

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

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-6">
            {isFirstStep && <CopyDetails errors={errors} control={control} />}
            {isLastStep && (
              <AdditionalInfo
                errors={errors}
                control={control}
                onBack={() => setStep(Step.CopyDetails)}
              />
            )}
          </div>
        </form>
      </div>
    </>
  );
}
