import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, CATEGORIES, CONDITIONS, LISTING_TYPES, CURRENCIES, CURRENCY_SYMBOLS } from '../../validators/productSchema.js';
import ImageUpload from '../ui/ImageUpload.jsx';

export default function ProductForm({
  product = null,
  onSave,
  onCancel = null,
  submitLabel = 'Add Product',
}) {
  const isEdit = Boolean(product);
  const [imageUrls, setImageUrls] = useState(product?.images || []);
  const [imageSession, setImageSession] = useState(0);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isInvalid, isSubmitting },
    reset,
    clearErrors,
    setError: setFieldError,
    watch,
  } = useForm({
    resolver: zodResolver(productSchema),
    mode: 'onBlur',
    defaultValues: {
      title: product?.title || '',
      description: product?.description || '',
      price: product?.price ?? '',
      currency: product?.currency || 'SEK',
      inventory: product?.inventory ?? '',
      category: product?.category || '',
      condition: product?.condition || 'used_good',
      listingType: product?.listingType || 'selling',
      canBeSent: product?.canBeSent || false,
      freeShipping: product?.freeShipping || false,
    },
  });

  useEffect(() => {
    setImageUrls(product?.images || []);
  }, [product?._id]);

  const onInvalid = () => {
    setFormError('Please fix the highlighted errors.');
  };

  const onValid = async (values) => {
    setFormError('');
    clearErrors();

    if (imageUrls.length === 0) {
      setFormError('Please upload at least one product image.');
      return;
    }

    setSaving(true);
    try {
      const result = await onSave({
        title: values.title.trim(),
        description: values.description.trim(),
        price: values.price,
        currency: values.currency,
        inventory: values.inventory,
        category: values.category,
        listingType: values.listingType,
        canBeSent: values.canBeSent,
        freeShipping: values.freeShipping,
        images: imageUrls,
      });

      if (!result?.ok) {
        if (result?.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            setFieldError(field, { type: 'server', message });
          });
          setFormError('Please fix the errors above.');
        } else {
          setFormError(result?.message || 'Failed to save product.');
        }
        return;
      }

      if (!isEdit) {
        reset({ title: '', description: '', price: '', inventory: '', category: '' });
        setImageUrls([]);
        setImageSession((k) => k + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="rounded bg-red-50 p-3 text-sm text-red-700 border border-red-100"
        >
          {formError}
        </div>
      )}

      <div>
        <p className="mb-2 font-bold text-gray-900">Listing Type</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="listingType" value="selling" defaultChecked /> selling
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="listingType" value="given" className="accent-blue-600" /> Given away
          </label>
        </div>
      </div>

      <ImageUpload
        key={`${product?._id || 'new'}-${imageSession}`}
        label="Product image"
        multiple
        initialUrls={product?.images || []}
        onChange={() => {}}
        onImagesChange={setImageUrls}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="product-title" className="mb-1 block text-sm font-medium">
            Title
          </label>
          <input
            id="product-title"
            {...register('title')}
            placeholder="Enter product title"
            className={`w-full rounded border px-3 py-2 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="product-description" className="mb-1 block text-sm font-medium">
            Description
          </label>
          <textarea
            id="product-description"
            {...register('description')}
            rows={3}
            placeholder="Describe your product (optional)"
            className={`w-full rounded border px-3 py-2 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <div className="mb-1 block text-sm font-medium">Price</div>
          <div className="relative w-full">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium"
            >
              {CURRENCY_SYMBOLS[watch('currency', 'SEK')] || '$'}
            </span>
            <input
              id="product-price"
              {...register('price')}
              type="number"
              step="1"
              min="0"
              placeholder="0"
              className={`w-full rounded border pl-10 pr-3 py-2 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
          </div>
          <div className="mt-2">
            <label htmlFor="product-currency" className="mb-1 block text-sm font-medium">
              Currency
            </label>
            <select
              id="product-currency"
              {...register('currency')}
              className="w-full rounded border px-3 py-2 text-sm border-gray-300"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="product-inventory" className="mb-1 block text-sm font-medium">
            Stock quantity
          </label>
          <input
            id="product-inventory"
            {...register('inventory')}
            type="number"
            placeholder="0"
            className={`w-full rounded border px-3 py-2 ${
              errors.inventory ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.inventory && (
            <p className="mt-1 text-sm text-red-600">{errors.inventory.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="product-category" className="mb-1 block text-sm font-medium">
            Category
          </label>
          <select
            id="product-category"
            {...register('category')}
            className={`w-full rounded border px-3 py-2 ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="product-condition" className="mb-1 block text-sm font-medium">
            Condition
          </label>
          <select
            id="product-condition"
            {...register('condition')}
            className={`w-full rounded border px-3 py-2 ${
              errors.condition ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.condition && (
            <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <p className="mb-2 font-bold text-gray-900">Delivery options</p>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('canBeSent')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Can be sent</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('freeShipping')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Free shipping</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isInvalid || busy}
          className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
            isInvalid || busy ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {busy ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
