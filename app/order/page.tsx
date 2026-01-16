"use client";

import { Button } from "@mantine/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";

import { Routes } from "@/config";
import { Urgency } from "@/types";
import { useTelegram } from "@/context";
import { BackButton } from "@/components";

import { PrintJobCard } from "./print-job-card";
import { orderSchema, OrderFormData, defaultPrintJob } from "./config";

export default function Order() {
  const { user } = useTelegram();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      comment: "",
      telegramId: user?.id,
      urgency: Urgency.ASAP,
      printJobs: [defaultPrintJob],
    },
  });

  const {
    fields: printJobFields,
    append: appendPrintJob,
    remove: removePrintJob,
  } = useFieldArray({
    control,
    name: "printJobs",
  });

  const onSubmit = (data: OrderFormData) => {
    console.log("Form data:", data);
  };

  return (
    <div className="p-4 m-auto h-full">
      <BackButton url={Routes.Home} className="mb-2" />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-6">
          {printJobFields.map((field, index) => (
            <PrintJobCard
              index={index}
              key={field.id}
              errors={errors}
              control={control}
              canRemove={printJobFields.length > 1}
              onRemove={() => removePrintJob(index)}
            />
          ))}

          <Button
            fullWidth
            variant="light"
            onClick={() => appendPrintJob(defaultPrintJob)}
          >
            Добавить еще одну работу печати
          </Button>

          <Button size="lg" fullWidth type="submit" color="teal">
            Оформить заказ
          </Button>
        </div>
      </form>
    </div>
  );
}
