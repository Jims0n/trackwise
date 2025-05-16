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

interface AccountFormProps {
  onSuccess?: () => void;
}

const AccountForm = ({ onSuccess }: AccountFormProps) => {
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
        form.reset();
        toast.success("Account created successfully");
        router.refresh();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.error || "Failed to create account");
      }
    } catch (error) {
      toast.error("Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#444444] rounded-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control as any}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white font-medium">Account Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. My Checking Account" 
                    className="border-gray-300 focus:border-black focus:ring-black" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription className="text-white text-sm">
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
                <FormLabel className="text-white font-medium">Initial Balance</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="e.g. 1000" 
                    className="border-gray-300 focus:border-black focus:ring-black" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription className="text-white text-sm">
                  The starting balance for this account.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 p-4 bg-gray-50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-black data-[state=checked]:border-black"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-gray-700 font-medium">
                    Set as default account
                  </FormLabel>
                  <FormDescription className="text-gray-500 text-sm">
                    This account will be used as the default for new transactions.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-black hover:bg-gray-800 text-white" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default AccountForm
