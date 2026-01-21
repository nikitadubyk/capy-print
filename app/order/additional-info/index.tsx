"use client";

import { ArrowLeft } from "lucide-react";
import { TimePicker } from "@mantine/dates";
import { Controller, useFormContext } from "react-hook-form";
import { Button, Paper, Radio, TextInput } from "@mantine/core";

import { Urgency, UrgencyTitle } from "@/types";

import { OrderFormData } from "../config";

interface AdditionalInfoProps {
  onBack: () => void;
}

export const AdditionalInfo = ({ onBack }: AdditionalInfoProps) => {
  const {
    setValue,
    control,
    formState: { errors },
  } = useFormContext<OrderFormData>();

  return (
    <>
      <div className="flex flex-col gap-6">
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
                  onChange={(value) => {
                    field.onChange(value);
                    setValue("deadlineAt", "");
                  }}
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
                      <div className="flex flex-col gap-1">
                        <TimePicker
                          className="mt-2"
                          label="Выберите время"
                          value={timeField.value}
                          onChange={timeField.onChange}
                          error={errors.deadlineAt?.message}
                        />
                        <p className="text-gray-500 text-xs">
                          Принимаем заказы только в рабочее время
                        </p>
                      </div>
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
                description="Добавьте любой комментарий к заказу"
              />
            </Paper>
          )}
        />
      </div>

      <div className="flex flex-col gap-2 mt-auto pt-6">
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
      </div>
    </>
  );
};
