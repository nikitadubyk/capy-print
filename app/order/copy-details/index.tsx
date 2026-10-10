"use client";

import { Button, Text } from "@mantine/core";
import { Plus, ArrowRight } from "lucide-react";
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
          size="md"
          leftSection={<Plus size={18} aria-hidden="true" />}
          onClick={() => appendPrintJob(defaultPrintJob)}
        >
          Добавить ещё одну печать
        </Button>
      </div>

      <div className="mt-auto pt-8">
        <Text size="sm" c="dimmed" className="mb-3">
          На следующем шаге — срок получения и комментарий.
        </Text>
        <Button
          size="lg"
          fullWidth
          radius="lg"
          type="submit"
          rightSection={<ArrowRight size={20} aria-hidden="true" />}
        >
          Далее
        </Button>
      </div>
    </>
  );
};
