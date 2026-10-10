import { Text, Title } from "@mantine/core";
import { BackButton } from "./back-button";

interface PageHeaderProps {
  title: string;
  backUrl?: string;
  onBack?: () => void;
  description?: string;
}

export const PageHeader = ({
  title,
  backUrl,
  onBack,
  description,
}: PageHeaderProps) => (
  <header className="mb-8">
    <div className="flex items-center gap-3 md:gap-4">
      {onBack ? (
        <BackButton onClick={onBack} />
      ) : (
        backUrl && <BackButton url={backUrl} />
      )}
      <Title order={2} component="h1">
        {title}
      </Title>
    </div>
    {description && (
      <Text c="dimmed" className="mt-3">
        {description}
      </Text>
    )}
  </header>
);
