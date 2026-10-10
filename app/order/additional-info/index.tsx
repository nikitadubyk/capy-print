"use client";

import dayjs from "dayjs";
import { DateTimePicker } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import { Controller, useFormContext } from "react-hook-form";
import { Button, Radio, Text, Textarea } from "@mantine/core";
import { twMerge } from "tailwind-merge";

import { Urgency, UrgencyTitle } from "@/types";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import {
  type OrderFormData,
  getWorkingHoursDescription,
  getDeadlineCalendarBounds,
} from "../config";

interface AdditionalInfoProps {
  onBack: () => void;
}

export const AdditionalInfo = ({ onBack }: AdditionalInfoProps) => {
  const {
    watch,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext<OrderFormData>();
  const isMobile = useMediaQuery("(max-width: 639px)");
  const { minDate, maxDate } = getDeadlineCalendarBounds();
  const excludeDate = (date: string) => dayjs(date).day() === 1;
  const deadlineAt = watch("deadlineAt");
  const workingHoursHint = deadlineAt
    ? getWorkingHoursDescription(dayjs(deadlineAt))
    : "Будние дни: 8:00–13:00, выходные: 8:00–11:30";

  return (
    <>
      <PageHeader
        title="Получение заказа"
        onBack={onBack}
        description="Шаг 2 из 2 · Срок получения и комментарий"
      />
      <div className="flex flex-col gap-6">
        <SectionCard>
          <Controller
            name="urgency"
            control={control}
            render={({ field }) => (
              <Radio.Group
                name="urgency"
                label="Когда нужен заказ?"
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  setValue("deadlineAt", "");
                }}
              >
                <div className="mt-3 flex flex-col gap-3">
                  {Object.values(Urgency).map((value) => (
                    <Radio.Card
                      key={value}
                      value={value}
                      radius="lg"
                      aria-label={UrgencyTitle[value]}
                      className={twMerge(
                        "flex w-full items-center gap-3 p-4 transition-colors duration-150 hover:border-capy-accent motion-reduce:transition-none",
                        value === field.value &&
                          "border-capy-accent bg-capy-blue/30"
                      )}
                    >
                      <Radio.Indicator size="md" />
                      <Text fw={500}>{UrgencyTitle[value]}</Text>
                    </Radio.Card>
                  ))}
                </div>
              </Radio.Group>
            )}
          />
          {watch("urgency") === Urgency.SCHEDULED && (
            <Controller
              name="deadlineAt"
              control={control}
              render={({ field }) => (
                <div className="mt-5">
                  <DateTimePicker
                    minDate={minDate}
                    maxDate={maxDate}
                    excludeDate={excludeDate}
                    size={isMobile ? "md" : "lg"}
                    label="Дата и время получения"
                    valueFormat="DD.MM.YYYY HH:mm"
                    placeholder="Выберите дату и время"
                    value={field.value ? dayjs(field.value).toDate() : null}
                    onChange={(date) =>
                      setValue(
                        "deadlineAt",
                        date ? dayjs(date).toISOString() : "",
                        { shouldDirty: true, shouldValidate: true }
                      )
                    }
                    onDropdownClose={() => void trigger("deadlineAt")}
                    error={errors.deadlineAt?.message}
                    dropdownType="modal"
                    modalProps={{
                      title: "Выберите дату и время",
                      fullScreen: isMobile,
                      withCloseButton: true,
                      closeButtonProps: {
                        "aria-label": "Закрыть выбор даты и времени",
                      },
                      size: "lg",
                      padding: isMobile ? "xs" : "lg",
                      classNames: {
                        body: "flex flex-col items-center",
                      },
                    }}
                    classNames={{
                      input: "min-h-12",
                      day: "text-base",
                      calendarHeaderControl: "min-h-11 min-w-11",
                    }}
                    timePickerProps={{
                      min: "00:00",
                      max: "23:59",
                      size: "lg",
                      hoursInputLabel: "Часы",
                      minutesInputLabel: "Минуты",
                    }}
                    submitButtonProps={{
                      size: 48,
                      "aria-label": "Подтвердить дату и время",
                    }}
                    clearButtonProps={{ "aria-label": "Очистить дату и время" }}
                    clearable
                  />
                  <Text size="sm" c="dimmed" className="mt-3">
                    {workingHoursHint}
                  </Text>
                  <Text size="sm" c="dimmed" className="mt-1">
                    Понедельник — выходной. Можно выбрать дату в пределах 3
                    дней.
                  </Text>
                </div>
              )}
            />
          )}
        </SectionCard>
        <SectionCard>
          <Controller
            name="comment"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                size="md"
                label="Комментарий к заказу"
                description="Добавьте пожелания к печати или получению"
                placeholder="Например: обрезать поля"
                minRows={3}
                autosize
              />
            )}
          />
        </SectionCard>
      </div>
      <div className="mt-auto pt-8">
        <Text size="sm" c="dimmed" className="mb-3">
          Оплата в копицентре при получении готового заказа.
        </Text>
        <Button size="lg" radius="lg" fullWidth type="submit">
          Оформить заказ
        </Button>
      </div>
    </>
  );
};
