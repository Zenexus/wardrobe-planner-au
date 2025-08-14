import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useStore } from "@/store";
import { loadDesignState } from "@/utils/memorySystem";

const ResumeSchema = z.object({
  code: z.string().min(6, "Enter a valid design code"),
});

type ResumeValues = z.infer<typeof ResumeSchema>;

const ResumeDesignForm = () => {
  const form = useForm<ResumeValues>({
    resolver: zodResolver(ResumeSchema),
    defaultValues: { code: "" },
  });

  const loadSavedStateToStore = useStore((s) => s.loadSavedState);

  const onSubmit = async (_values: ResumeValues) => {
    // For now, restore from local storage regardless of the code
    const saved = loadDesignState();
    if (saved) {
      loadSavedStateToStore(saved);
    } else {
      form.setError("code", {
        message: "No saved design found on this device",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Design code
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} className="h-[50px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || !form.watch("code")}
          className="w-full h-[50px] cursor-pointer"
        >
          Open
        </Button>
      </form>
    </Form>
  );
};

export default ResumeDesignForm;
