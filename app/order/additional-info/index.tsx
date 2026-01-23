"use client";

import dayjs from "dayjs";
import { ArrowLeft } from "lucide-react";
import { DateTimePicker } from "@mantine/dates";
import { Controller, useFormContext } from "react-hook-form";
import { Button, Paper, Radio, TextInput } from "@mantine/core";

import { Urgency, UrgencyTitle } from "@/types";

import { OrderFormData, getWorkingHoursDescription } from "../config";

interface AdditionalInfoProps {
  onBack: () => void;
}

export const AdditionalInfo = ({ onBack }: AdditionalInfoProps) => {
  const {
    watch,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<OrderFormData>();

  const minDate = new Date();
  const maxDate = dayjs().add(3, "day").toDate();

  const excludeDate = (date: string) => {
    const day = dayjs(date);
    return day.day() === 1;
  };

  const deadlineAt = watch("deadlineAt");
  const workingHoursHint = deadlineAt
    ? getWorkingHoursDescription(dayjs(deadlineAt))
    : "Будние дни: 8:00-13:00, Выходные: 8:00-11:30";

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
                        <DateTimePicker
                          className="mt-2"
                          minDate={minDate}
                          maxDate={maxDate}
                          excludeDate={excludeDate}
                          label="Выберите дату и время"
                          valueFormat="DD.MM.YYYY HH:mm"
                          placeholder="Выберите дату и время"
                          value={
                            timeField.value
                              ? dayjs(timeField.value).toDate()
                              : null
                          }
                          onChange={(date) =>
                            timeField.onChange(
                              date ? dayjs(date).toISOString() : "",
                            )
                          }
                          error={errors.deadlineAt?.message}
                          clearable
                        />
                        <p className="text-gray-500 text-xs">
                          {workingHoursHint}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Понедельник - выходной. Максимум на 3 дня вперед
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

        <Button size="lg" radius="md" fullWidth type="submit" color="teal">
          Оформить заказ
        </Button>
      </div>
    </>
  );
};
