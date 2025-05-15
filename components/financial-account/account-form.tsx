"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createFinancialAccount } from '@/app/actions/financial-account';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  balance: z.coerce.number().default(0),
  isDefault: z.boolean().default(false),
});

// Type for the form values
type FormValues = z.infer<typeof formSchema>

const AccountForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      balance: 0,
      isDefault: false,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const result = await createFinancialAccount(values);
      if (result.success) {
        toast.success("Account created successfully");
        form.reset();
        router.push("/dashboard");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Add a new account to manage your finances.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. My Checking Account" {...field} />
                  </FormControl>
                  <FormDescription>
                    Name of the account (e.g., "My Checking Account").
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          
            <FormField
              control={form.control as any}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Balance</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g. 1000" {...field} />
                  </FormControl>
                  <FormDescription>
                    Initial balance of the account (e.g., "1000").
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                  <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Default Account
                    </FormLabel>
                    <FormDescription>
                      Make this your default financial account
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

        <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Account"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default AccountForm
