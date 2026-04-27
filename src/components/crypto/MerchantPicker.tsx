import { useQuery } from "@tanstack/react-query";
import { extSelect } from "@/hooks/useExternalData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  includeAll?: boolean;
}

export function MerchantPicker({
  value,
  onChange,
  className,
  placeholder = "Select merchant",
  includeAll = true,
}: Props) {
  const { data: merchants = [] } = useQuery({
    queryKey: ["merchants-min"],
    queryFn: async () => {
      const rows = await extSelect("merchants", {
        select: "id, name",
        order: { column: "name", ascending: true },
      });
      return (rows || []) as Array<{ id: string; name: string }>;
    },
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="all">All merchants</SelectItem>}
        {merchants.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name || m.id.slice(0, 8)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}