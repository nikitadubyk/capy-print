"use client";

import { Button } from "@mantine/core";
import { useFieldArray, useFormContext } from "react-hook-form";

import { defaultPrintJob, OrderFormData } from "../config";

import { PrintJobCard } from "./print-job-card";

export const CopyDetails = () => {
  const { control } = useFormContext<OrderFormData>();

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
      <div className="flex flex-col gap-6">
        {printJobFields.map((field, index) => (
          <PrintJobCard
            index={index}
            key={field.id}
            canRemove={printJobFields.length > 1}
            onRemove={() => removePrintJob(index)}
          />
        ))}

        <Button
          fullWidth
          variant="light"
          className="mb-4"
          onClick={() => appendPrintJob(defaultPrintJob)}
        >
          Добавить еще одну печать
        </Button>
      </div>

      <Button
        size="lg"
        fullWidth
        radius="md"
        color="teal"
        type="submit"
        className="mt-auto"
      >
        Далее
      </Button>
    </>
  );
};
