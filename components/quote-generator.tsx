
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Plus, Trash2, Calculator, FileText, Send, Eye } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const itemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
});

const formSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  client_email: z.string().email().optional().or(z.literal('')),
  client_address: z.string().optional().or(z.literal('')),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional().or(z.literal('')),
  valid_until: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface Quote {
  id: string;
  title: string;
  total: number;
  status: string;
  created_at: string;
  items: any;
  client_name?: string;
  client_email?: string;
  client_address?: string;
  quote_number?: string;
  subtotal?: number;
  vat_amount?: number;
  notes?: string;
  valid_until?: string;
}

export function QuoteGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'create' | 'list'>('list');
  const { toast } = useToast();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { control, register, watch, reset, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_name: '',
      client_email: '',
      client_address: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      notes: 'This quote is valid for 30 days from the date of issue.',
      valid_until: '',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const values = watch();

  // Fetch existing quotes
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes', companyId?.companyId],
    queryFn: async () => {
      if (!companyId?.companyId) return [];
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('company_id', companyId.companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Quote[];
    },
    enabled: !!companyId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel('quotes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['quotes', companyId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, queryClient]);

  // Create quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!companyId?.companyId) throw new Error('No company ID');
      
      const total = calculateTotal();
      const subtotal = total / 1.2;
      const vatAmount = total - subtotal;
      const quoteNumber = `QUO-${Date.now().toString().slice(-6)}`;
      
      const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
          company_id: companyId.companyId,
          title: `Quote for ${data.client_name}`,
          items: data.items,
          total,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return quote;
    },
    onSuccess: () => {
      toast({ title: "Quote created successfully" });
      reset();
      setViewMode('list');
    },
    onError: (error: any) => {
      toast({
        title: "Error creating quote",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const calculateTotal = () => {
    return values.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
  };

  const onSubmit = (data: FormValues) => {
    setIsGenerating(true);
    createQuoteMutation.mutate(data);
    setIsGenerating(false);
  };

  if (viewMode === 'create') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Quote</h1>
            <p className="text-muted-foreground">Generate professional quotes for your construction projects</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setViewMode('list')}>
              <Eye className="h-4 w-4 mr-2" />
              View Quotes
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  {...register('client_name')}
                  placeholder="Client company or person name"
                  className={errors.client_name ? 'border-red-500' : ''}
                />
                {errors.client_name && <p className="text-red-500 text-sm mt-1">{errors.client_name.message}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    {...register('client_email')}
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    {...register('valid_until')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="client_address">Address</Label>
                <Textarea
                  id="client_address"
                  {...register('client_address')}
                  placeholder="Client address"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quote Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Quote Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    {index === 0 && <Label className="text-sm">Description</Label>}
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder="Description of work"
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && <Label className="text-sm">Quantity</Label>}
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      placeholder="1.00"
                    />
                  </div>
                  <div className="col-span-3">
                    {index === 0 && <Label className="text-sm">Unit Price (£)</Label>}
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    £{calculateTotal().toFixed(2)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register('notes')}
                placeholder="Terms and conditions, payment details, etc."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setViewMode('list')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isGenerating || createQuoteMutation.isPending}>
              {isGenerating || createQuoteMutation.isPending ? (
                <>Creating...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Quote
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quotes</h1>
          <p className="text-muted-foreground">Manage your construction project quotes</p>
        </div>
        <Button onClick={() => setViewMode('create')}>
          <Plus className="h-4 w-4 mr-2" />
          New Quote
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">Loading quotes...</div>
          ) : quotes && quotes.length > 0 ? (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{quote.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(quote.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">£{quote.total.toFixed(2)}</p>
                    <Badge variant={quote.status === 'draft' ? 'secondary' : 'default'}>
                      {quote.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No quotes yet. Create your first quote!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
