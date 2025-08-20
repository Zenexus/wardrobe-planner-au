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
import { getDesignByCode } from "@/services/designService";

const ResumeSchema = z.object({
  code: z.string().min(1, "Enter a design code"),
});

type ResumeValues = z.infer<typeof ResumeSchema>;

const ResumeDesignForm = () => {
  const form = useForm<ResumeValues>({
    resolver: zodResolver(ResumeSchema),
    defaultValues: { code: "" },
  });

  const loadSavedStateToStore = useStore((s) => s.loadSavedState);

  const onSubmit = async (values: ResumeValues) => {
    try {
      const designCode = values.code.trim().toUpperCase();

      // Load design from Firebase using the provided code
      const result = await getDesignByCode(designCode);

      if (result.success && result.data) {
        // Convert Firebase data to our SavedDesignState format
        const designState = {
          version: result.data.version,
          date: result.data.date,
          designId: result.data.designId,
          designData: result.data.designData,
          shoppingCart: result.data.shoppingCart,
          totalPrice: result.data.totalPrice,
          firebaseId: result.data.id,
        };

        const loadSuccess = loadSavedStateToStore(designState);
        if (loadSuccess) {
          form.reset();
        } else {
          form.setError("code", {
            message: "Failed to load design. Please try again.",
          });
        }
      } else {
        form.setError("code", {
          message: "Design code not found. Please check and try again.",
        });
      }
    } catch (error) {
      console.error("Error loading design:", error);
      form.setError("code", {
        message: "Error loading design. Please try again.",
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
          {form.formState.isSubmitting ? "Loading..." : "Open"}
        </Button>
      </form>
    </Form>
  );
};

export default ResumeDesignForm;
