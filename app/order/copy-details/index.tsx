"use client";

import { Button } from "@mantine/core";
import { Control, FieldErrors, useFieldArray } from "react-hook-form";

import { defaultPrintJob, OrderFormData } from "../config";

import { PrintJobCard } from "./print-job-card";

interface CopyDetailsProps {
  control: Control<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
}

export const CopyDetails = ({ errors, control }: CopyDetailsProps) => {
  const {
    fields: printJobFields,
    append: appendPrintJob,
    remove: removePrintJob,
  } = useFieldArray({
    control,
    name: "printJobs",
  });

  return (
    <>
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
        Далее
      </Button>
    </>
  );
};
