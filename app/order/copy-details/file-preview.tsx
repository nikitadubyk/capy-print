"use client";

import { useEffect, useRef } from "react";
import { ActionIcon, Paper, Text } from "@mantine/core";
import { FileText, Trash2 } from "lucide-react";
import type { OrderFormData } from "../config";

type PrintFile = OrderFormData["printJobs"][number]["files"][number];

interface FilePreviewProps {
  file: PrintFile;
  onRemove: () => void;
}

export const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  const local = file instanceof File;
  const name = local ? file.name : file.fileName;
  const size = local ? file.size : file.fileSize;
  const mimeType = local ? file.type : file.mimeType;
  const sizeLabel =
    size < 1024 ? `${size} Б` : `${(size / 1024).toFixed(0)} КБ`;
  const isImage = mimeType.startsWith("image/");
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isImage || !imageRef.current) return;
    const source = local ? URL.createObjectURL(file) : file.fileUrl;
    imageRef.current.src = source;
    return () => {
      if (local) URL.revokeObjectURL(source);
    };
  }, [file, isImage, local]);

  return isImage ? (
    <Paper withBorder radius="lg" className="relative overflow-hidden bg-white">
      {/* Selected files use local blob URLs; no optimizer or remote upload is needed. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        alt={name}
        className="aspect-4/3 w-full bg-capy-blue/30 object-contain"
      />
      <ActionIcon
        aria-label={`Удалить файл ${name}`}
        onClick={onRemove}
        variant="filled"
        className="absolute top-2 right-2 shadow-sm"
      >
        <Trash2 size={20} aria-hidden="true" />
      </ActionIcon>
      <div className="min-w-0 p-3">
        <Text size="sm" fw={500} truncate title={name}>
          {name}
        </Text>
        <Text size="sm" c="dimmed">
          {sizeLabel}
        </Text>
      </div>
    </Paper>
  ) : (
    <Paper
      withBorder
      radius="lg"
      className="col-span-2 flex min-w-0 items-center gap-3 bg-capy-blue/20 p-3 lg:col-span-3"
    >
      <FileText
        size={22}
        className="shrink-0 text-capy-accent"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <Text fw={500} truncate title={name}>
          {name}
        </Text>
        <Text size="sm" c="dimmed">
          {sizeLabel}
        </Text>
      </div>
      <ActionIcon
        aria-label={`Удалить файл ${name}`}
        onClick={onRemove}
        variant="subtle"
      >
        <Trash2 size={20} aria-hidden="true" />
      </ActionIcon>
    </Paper>
  );
};
