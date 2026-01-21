import { useEffect } from "react";
import { Dropzone } from "@mantine/dropzone";
import { Trash, Upload, X, Minus, Plus, AlertCircle } from "lucide-react";
import {
  useWatch,
  Controller,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import {
  Text,
  Paper,
  Title,
  Select,
  Divider,
  ActionIcon,
  SegmentedControl,
} from "@mantine/core";

import { cn } from "@/lib/utils";
import { PaperSize, PaperSizeTitle } from "@/types";

import { acceptFiles, OrderFormData } from "../config";

import { Card } from "./card";

interface PrintJobCardProps {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}

const getFileInfo = (file: File | { fileName: string; fileSize: number }) => {
  if (file instanceof File) {
    return {
      name: file.name,
      size: file.size,
    };
  }
  return {
    name: file.fileName,
    size: file.fileSize,
  };
};

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
    formState: { errors },
  } = useFormContext<OrderFormData>();

  const {
    fields: fileFields,
    append: appendFile,
    remove: removeFile,
  } = useFieldArray({
    control,
    name: `printJobs.${index}.files`,
  });

  const handleDrop = async (files: File[]) => {
    files.forEach((file) => {
      appendFile(file);
    });
  };

  const watchPaperSize = useWatch({
    control,
    name: `printJobs.${index}.paperSize`,
  });
  const isPhotoPaper = watchPaperSize?.includes("Photo");

  useEffect(() => {
    if (isPhotoPaper) {
      setValue(`printJobs.${index}.duplex`, false);
    }
  }, [isPhotoPaper, index, setValue]);

  const fileError = errors.printJobs?.[index]?.files?.message;
  const hasError = !!fileError;

  return (
    <Paper p="lg" shadow="sm" radius="lg" className="border border-gray-200">
      {canRemove && (
        <div className="flex justify-between items-center gap-4 p-2">
          <p className="text-gray-400">Печать #{index + 1}</p>
          <ActionIcon color="red" variant="subtle" onClick={onRemove}>
            <Trash />
          </ActionIcon>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div>
          <Dropzone
            onDrop={handleDrop}
            accept={acceptFiles}
            onReject={(files) => console.log("rejected files", files)}
            className={cn(
              "border-2 rounded-xl border-dashed p-4 border-gray-200 bg-gray-50",
              hasError && "border-red-500 bg-red-50",
            )}
          >
            <div className="flex flex-col gap-2 items-center text-gray-400">
              <Upload />
              <h5 className="text-center">
                Нажмите, чтобы добавить
                <br />
                файлы (PDF, DOCX, JPG, PNG)
              </h5>
            </div>
          </Dropzone>

          {hasError && (
            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <span>{fileError}</span>
            </div>
          )}
        </div>

        {fileFields.length > 0 && (
          <div className="flex flex-col gap-2">
            {fileFields.map((fileField, fileIndex) => (
              <Controller
                control={control}
                key={fileField.id}
                name={`printJobs.${index}.files.${fileIndex}`}
                render={({ field }) => {
                  const { name, size } = getFileInfo(field.value);

                  return (
                    <Paper
                      p="sm"
                      withBorder
                      radius="md"
                      className="bg-gray-200"
                    >
                      <div className="flex justify-between gap-4">
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                            {name}
                          </p>
                          <p>{(size / 1024).toFixed(0)} КБ</p>
                        </div>
                        <ActionIcon
                          color="gray"
                          variant="subtle"
                          onClick={() => removeFile(fileIndex)}
                        >
                          <X />
                        </ActionIcon>
                      </div>
                    </Paper>
                  );
                }}
              />
            ))}
          </div>
        )}

        <Divider />

        <div className="flex flex-col gap-4">
          <Title order={4}>Параметры печати</Title>

          <Card title="Копий">
            <Controller
              control={control}
              name={`printJobs.${index}.copies`}
              render={({ field }) => (
                <div className="flex gap-2 items-center">
                  <ActionIcon
                    size="lg"
                    radius="md"
                    variant="default"
                    onClick={() => field.onChange(Math.max(1, field.value - 1))}
                  >
                    <Minus />
                  </ActionIcon>
                  <Text size="lg" fw={500} className="min-w-10 text-center">
                    {field.value}
                  </Text>
                  <ActionIcon
                    size="lg"
                    radius="md"
                    variant="default"
                    onClick={() =>
                      field.onChange(Math.min(1000, field.value + 1))
                    }
                  >
                    <Plus />
                  </ActionIcon>
                </div>
              )}
            />
          </Card>

          <Card title="Бумага">
            <Controller
              control={control}
              name={`printJobs.${index}.paperSize`}
              render={({ field, fieldState: { error } }) => (
                <div>
                  <Select
                    {...field}
                    error={!!error}
                    data={paperOptions}
                    className="min-w-40"
                  />
                  {error && (
                    <div className="flex items-center gap-1 mt-2 text-red-600 text-xs">
                      <AlertCircle size={14} />
                      <span>{error.message}</span>
                    </div>
                  )}
                </div>
              )}
            />
          </Card>

          <Card title="Цветность">
            <Controller
              control={control}
              name={`printJobs.${index}.isColor`}
              render={({
                fieldState: { error },
                field: { value, onChange },
              }) => (
                <div>
                  <SegmentedControl
                    radius="md"
                    value={value ? "color" : "bw"}
                    onChange={(val) => onChange(val === "color")}
                    data={[
                      { label: "Ч/Б", value: "bw" },
                      { label: "Цвет", value: "color" },
                    ]}
                  />
                  {error && (
                    <div className="flex items-center gap-1 mt-2 text-red-600 text-xs">
                      <AlertCircle size={14} />
                      <span>{error.message}</span>
                    </div>
                  )}
                </div>
              )}
            />
          </Card>

          <Card title="Двусторонняя">
            <Controller
              control={control}
              name={`printJobs.${index}.duplex`}
              render={({
                fieldState: { error },
                field: { value, onChange },
              }) => (
                <div className="flex flex-col justify-end">
                  <div className="flex justify-end">
                    <SegmentedControl
                      radius="md"
                      disabled={isPhotoPaper}
                      value={value ? "yes" : "no"}
                      onChange={(val) => onChange(val === "yes")}
                      data={[
                        { label: "Нет", value: "no" },
                        { label: "Да", value: "yes" },
                      ]}
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-1 mt-2 text-red-600 text-xs">
                      <AlertCircle size={14} />
                      <span>{error.message}</span>
                    </div>
                  )}
                  {isPhotoPaper && !error && (
                    <div className="flex items-center gap-1 mt-2 text-gray-500 text-xs">
                      <AlertCircle size={14} />
                      <span>Фотопечать доступна только односторонняя</span>
                    </div>
                  )}
                </div>
              )}
            />
          </Card>
        </div>
      </div>
    </Paper>
  );
};
