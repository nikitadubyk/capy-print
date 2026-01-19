"use client";

import { TimePicker } from "@mantine/dates";
import { Button, Paper, Radio, TextInput } from "@mantine/core";
import { Control, Controller, FieldErrors } from "react-hook-form";

import { Urgency } from "@/types";

import { OrderFormData } from "../config";

import { UrgencyTitle } from "./config";
import { ArrowLeft } from "lucide-react";

interface AdditionalInfoProps {
  onBack: () => void;
  control: Control<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
}

export const AdditionalInfo = ({ onBack, control }: AdditionalInfoProps) => {
  return (
    <>
      <Controller
        name="urgency"
        control={control}
        render={({ field }) => {
          const isShowTimePicker = field.value === Urgency.SCHEDULED;
          return (
            <Paper
              p="lg"
              shadow="sm"
              radius="lg"
              className="border border-gray-200"
            >
              <Radio.Group
                name="urgency"
                label="Когда нужно?"
                value={field.value}
                onChange={field.onChange}
              >
                <div className="flex flex-col gap-2">
                  {Object.values(Urgency).map((value) => (
                    <Radio
                      key={value}
                      value={value}
                      label={UrgencyTitle[value]}
                    />
                  ))}
                </div>
              </Radio.Group>

              {isShowTimePicker && (
                <Controller
                  name="deadlineAt"
                  control={control}
                  render={({ field: timeField }) => (
                    <TimePicker
                      label="Выберите время"
                      value={timeField.value}
                      onChange={timeField.onChange}
                    />
                  )}
                />
              )}
            </Paper>
          );
        }}
      />

      <Controller
        name="comment"
        control={control}
        render={({ field }) => (
          <Paper
            p="lg"
            shadow="sm"
            radius="lg"
            className="border border-gray-200"
          >
            <TextInput
              value={field.value}
              label="Комментарий"
              onChange={field.onChange}
              placeholder="Например: обрезать поля"
            />
          </Paper>
        )}
      />

      <Button
        fullWidth
        color="blue"
        onClick={onBack}
        leftSection={<ArrowLeft />}
      >
        Назад
      </Button>

      <Button size="lg" fullWidth type="submit" color="teal">
        Оформить заказ
      </Button>
    </>
  );
};
