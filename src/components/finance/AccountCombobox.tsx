import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { LocalAccount } from "@/lib/localStore";

interface AccountComboboxProps {
  accounts?: LocalAccount[];
  value?: number | null;
  onChange: (accountId: number) => void;
  placeholder?: string;
  className?: string;
}

export function AccountCombobox({
  accounts = [],
  value,
  onChange,
  placeholder = "اختر الحساب...",
  className,
}: AccountComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedAccount = React.useMemo(
    () => accounts.find((a) => a.id === value),
    [accounts, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-11 font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {selectedAccount ? (
            <div className="flex items-center gap-2 truncate">
              {selectedAccount.code && (
                <span className="text-xs text-muted-foreground">
                  {selectedAccount.code}
                </span>
              )}
              <span className="truncate">{selectedAccount.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="ابحث بالاسم أو الرقم..." />
          <CommandList>
            <CommandEmpty>لم يتم العثور على حساب.</CommandEmpty>
            {accounts.map((account) => (
              <CommandItem
                key={account.id}
                value={`${account.code || ""} ${account.name} ${account.nameEn || ""}`}
                onSelect={() => {
                  onChange(account.id);
                  setOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    value === account.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {account.code && (
                  <span className="text-xs text-muted-foreground w-12 shrink-0">
                    {account.code}
                  </span>
                )}
                <span className="truncate">{account.name}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
