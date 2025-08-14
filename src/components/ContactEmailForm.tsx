import { useState } from "react";
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
// email send method deprecated – no API call
import { Checkbox } from "@/components/ui/checkbox";

const ContactEmailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  name: z.string().min(1, "Name is required"),
  postcode: z.string().optional().or(z.literal("")),
  subscribe: z.boolean().default(false).optional(),
});

type ContactEmailValues = z.infer<typeof ContactEmailSchema>;

const ContactEmailForm = () => {
  const form = useForm<ContactEmailValues>({
    resolver: zodResolver(ContactEmailSchema),
    defaultValues: {
      email: "",
      name: "",
      postcode: "",
      subscribe: false,
    },
  });

  const [status, setStatus] = useState<
    null | "idle" | "loading" | "success" | "error"
  >(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onSubmit = async (_: ContactEmailValues) => {
    setStatus("loading");
    setErrorMessage("");

    setTimeout(() => {
      setStatus("success");
      form.reset();
    }, 400);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Email
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input type="email" {...field} className="h-[50px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} className="h-[50px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="postcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postcode</FormLabel>
              <FormControl>
                <Input {...field} className="h-[50px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subscribe"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={!!field.value}
                    className="h-5 w-5 cursor-pointer"
                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                    aria-label="Subscribe to updates"
                  />
                  <span className="text-gray-800">
                    Send me Rack It News, events and exclusive offers. We will
                    email you occasional news and special offers. We will not
                    sell or distribute your email to any third party at any
                    time.
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={
              status === "loading" ||
              !form.watch("email") ||
              !form.watch("name")
            }
            className="w-full h-[50px] cursor-pointer"
          >
            {status === "loading" ? "Submitting..." : "Submit"}
          </Button>
          {status === "success" && (
            <span className="text-green-600 text-sm">Submitted.</span>
          )}
          {status === "error" && (
            <span className="text-red-600 text-sm">{errorMessage}</span>
          )}
        </div>
      </form>
    </Form>
  );
};

export default ContactEmailForm;
