"use client";

import { useState, type FormEvent } from "react";
import { Alert, Text } from "@mantine/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { Routes } from "@/config/routes";
import { Urgency } from "@/types";
import { CopyDetails } from "./copy-details";
import { AdditionalInfo } from "./additional-info";
import { Step } from "./types";
import { orderSchema, type OrderFormData, defaultPrintJob } from "./config";

export const OrderForm = ({
  onSubmit,
  initialValues,
  submitError,
}: {
  onSubmit: (data: OrderFormData) => Promise<void>;
  initialValues?: OrderFormData;
  submitError?: string | null;
}) => {
  const [step, setStep] = useState(Step.CopyDetails);
  const methods = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: initialValues ?? {
      comment: "",
      deadlineAt: "",
      urgency: Urgency.ASAP,
      printJobs: [defaultPrintJob],
    },
  });
  const firstStep = step === Step.CopyDetails;
  const changeStep = (nextStep: Step) => {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const onNext = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await methods.trigger("printJobs", { shouldFocus: true }))
      changeStep(Step.AdditionalInfo);
  };

  return (
    <PageContainer className="flex flex-col">
      {firstStep && (
        <PageHeader
          title="Новый заказ"
          backUrl={Routes.Home}
          description="Шаг 1 из 2 · Файлы и параметры печати"
        />
      )}
      <FormProvider {...methods}>
        <form
          onSubmit={firstStep ? onNext : methods.handleSubmit(onSubmit)}
          className="flex min-w-0 flex-col flex-1"
        >
          {submitError && (
            <Alert
              color="red"
              role="alert"
              title="Не удалось оформить заказ"
              className="mb-6"
            >
              <Text>{submitError}</Text>
            </Alert>
          )}
          <fieldset
            disabled={methods.formState.isSubmitting}
            className="m-0 flex min-w-0 flex-1 flex-col border-0 p-0"
          >
            {firstStep ? (
              <CopyDetails />
            ) : (
              <AdditionalInfo onBack={() => changeStep(Step.CopyDetails)} />
            )}
          </fieldset>
        </form>
      </FormProvider>
    </PageContainer>
  );
};
