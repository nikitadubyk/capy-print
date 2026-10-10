"use client";

import { useEffect, useState } from "react";
import { Dropzone } from "@mantine/dropzone";
import { Trash2, Upload, Minus, Plus } from "lucide-react";
import {
  useWatch,
  Controller,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import {
  ActionIcon,
  Button,
  Divider,
  NumberInput,
  Select,
  SegmentedControl,
  Text,
  Title,
} from "@mantine/core";
import { twMerge } from "tailwind-merge";
import { SectionCard } from "@/components/section-card";

import { PaperSize, PaperSizeTitle } from "@/types";
import { acceptFiles, type OrderFormData } from "../config";
import { Card } from "./card";
import { FilePreview } from "./file-preview";

interface PrintJobCardProps {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}

const paperOptions = Object.values(PaperSize).map((value) => ({
  value,
  label: PaperSizeTitle[value],
}));

export const PrintJobCard = ({
  index,
  onRemove,
  canRemove,
}: PrintJobCardProps) => {
  const {
    control,
    setValue,
    clearErrors,
    trigger,
    formState: { errors },
  } = useFormContext<OrderFormData>();
  const {
    fields: fileFields,
    append: appendFile,
    remove: removeFile,
  } = useFieldArray({ control, name: `printJobs.${index}.files` });
  const [rejection, setRejection] = useState<string | null>(null);
  const paperSize = useWatch({ control, name: `printJobs.${index}.paperSize` });
  const isPhotoPaper = paperSize?.includes("Photo");

  useEffect(() => {
    if (isPhotoPaper)
      setValue(`printJobs.${index}.duplex`, false, { shouldValidate: true });
  }, [isPhotoPaper, index, setValue]);

  const fileError = errors.printJobs?.[index]?.files?.message || rejection;

  return (
    <SectionCard>
      <header className="mb-5 flex items-center justify-between gap-3">
        <Title order={3}>Печать #{index + 1}</Title>
        {canRemove && (
          <ActionIcon
            aria-label={`Удалить печать #${index + 1}`}
            variant="light"
            onClick={onRemove}
          >
            <Trash2 size={20} aria-hidden="true" />
          </ActionIcon>
        )}
      </header>
      <div className="flex flex-col gap-5">
        <div>
          <Dropzone
            onDrop={(files) => {
              if (!files.length) return;
              setRejection(null);
              appendFile(files);
              clearErrors(`printJobs.${index}.files`);
            }}
            accept={acceptFiles}
            onReject={() =>
              setRejection(
                "Этот формат не поддерживается. Выберите документ или изображение из списка ниже."
              )
            }
            className={twMerge(
              "cursor-pointer rounded-xl border-2 border-dashed border-capy-line bg-capy-blue/20 p-5 transition-colors duration-150 hover:border-capy-accent hover:bg-capy-blue/40 motion-reduce:transition-none",
              !!fileError && "border-red-500 bg-red-50"
            )}
            aria-label={`Добавить файлы для печати #${index + 1}`}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <Upload
                size={28}
                className="text-capy-accent"
                aria-hidden="true"
              />
              <Text fw={600}>Добавить файлы</Text>
              <Text size="sm" c="dimmed">
                Нажмите или перетащите сюда
              </Text>
              <Text size="sm" c="dimmed">
                PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, SVG
              </Text>
            </div>
          </Dropzone>
          {fileError && (
            <Text size="sm" c="red" role="alert" className="mt-2">
              {fileError}
            </Text>
          )}
        </div>
        {fileFields.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {fileFields.map((fileField, fileIndex) => (
              <Controller
                key={fileField.id}
                control={control}
                name={`printJobs.${index}.files.${fileIndex}`}
                render={({ field }) => (
                  <FilePreview
                    file={field.value}
                    onRemove={() => {
                      removeFile(fileIndex);
                      void trigger(`printJobs.${index}.files`);
                    }}
                  />
                )}
              />
            ))}
          </div>
        )}
        <Divider />
        <Title order={4}>Параметры печати</Title>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          <Card title="Количество копий">
            <Controller
              control={control}
              name={`printJobs.${index}.copies`}
              render={({ field, fieldState }) => (
                <div>
                  <div className="flex items-center gap-2">
                    <Button
                      aria-label={`Уменьшить количество копий печати #${index + 1}`}
                      variant="light"
                      size="lg"
                      className="w-14 shrink-0 px-0"
                      disabled={field.value <= 1}
                      onClick={() =>
                        field.onChange(Math.max(1, field.value - 1))
                      }
                    >
                      <Minus size={20} aria-hidden="true" />
                    </Button>
                    <NumberInput
                      {...field}
                      aria-label={`Количество копий печати #${index + 1}`}
                      size="lg"
                      min={1}
                      max={1000}
                      allowDecimal={false}
                      allowNegative={false}
                      clampBehavior="strict"
                      hideControls
                      error={!!fieldState.error}
                      onChange={(value) =>
                        field.onChange(typeof value === "number" ? value : 1)
                      }
                      className="min-w-0 flex-1"
                      classNames={{ input: "text-center" }}
                    />
                    <Button
                      aria-label={`Увеличить количество копий печати #${index + 1}`}
                      variant="light"
                      size="lg"
                      className="w-14 shrink-0 px-0"
                      disabled={field.value >= 1000}
                      onClick={() =>
                        field.onChange(Math.min(1000, field.value + 1))
                      }
                    >
                      <Plus size={20} aria-hidden="true" />
                    </Button>
                  </div>
                  {fieldState.error && (
                    <Text size="sm" c="red" className="mt-2">
                      {fieldState.error.message}
                    </Text>
                  )}
                </div>
              )}
            />
          </Card>
          <Card title="Бумага">
            <Controller
              control={control}
              name={`printJobs.${index}.paperSize`}
              render={({ field, fieldState }) => (
                <Select
                  {...field}
                  aria-label={`Бумага печати #${index + 1}`}
                  data={paperOptions}
                  error={fieldState.error?.message}
                />
              )}
            />
          </Card>
          <Card title="Цветность">
            <Controller
              control={control}
              name={`printJobs.${index}.isColor`}
              render={({ field: { value, onChange }, fieldState }) => (
                <div>
                  <SegmentedControl
                    aria-label={`Цветность печати #${index + 1}`}
                    value={value ? "color" : "bw"}
                    onChange={(value) => onChange(value === "color")}
                    data={[
                      { label: "Чёрно-белая", value: "bw" },
                      { label: "Цветная", value: "color" },
                    ]}
                  />
                  {fieldState.error && (
                    <Text size="sm" c="red" className="mt-2">
                      {fieldState.error.message}
                    </Text>
                  )}
                </div>
              )}
            />
          </Card>
          <Card title="Двусторонняя печать">
            <Controller
              control={control}
              name={`printJobs.${index}.duplex`}
              render={({ field: { value, onChange }, fieldState }) => (
                <div>
                  <SegmentedControl
                    aria-label={`Двусторонняя печать #${index + 1}`}
                    disabled={isPhotoPaper}
                    value={value ? "yes" : "no"}
                    onChange={(value) => onChange(value === "yes")}
                    data={[
                      { label: "Нет", value: "no" },
                      { label: "Да", value: "yes" },
                    ]}
                  />
                  {fieldState.error ? (
                    <Text size="sm" c="red" className="mt-2">
                      {fieldState.error.message}
                    </Text>
                  ) : (
                    isPhotoPaper && (
                      <Text size="sm" c="dimmed" className="mt-2">
                        Фотопечать доступна только односторонняя.
                      </Text>
                    )
                  )}
                </div>
              )}
            />
          </Card>
        </div>
      </div>
    </SectionCard>
  );
};
