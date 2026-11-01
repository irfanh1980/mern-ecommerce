import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, CATEGORIES, CURRENCIES, CURRENCY_SYMBOLS } from '../validators/productSchema.js';
import ImageUpload from '../components/ui/ImageUpload.jsx';

export default function AddProduct() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [transactionType, setTransactionType] = useState('given');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isInvalid, isSubmitting },
    reset,
    setError: setFieldError,
    watch,
  } = useForm({
    resolver: zodResolver(productSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      price: '',
      currency: 'SEK',
      inventory: '',
      category: '',
    },
  });

  const onInvalid = () => {
    setAlert('Please fix the highlighted errors.');
  };

  const onValid = async (values) => {
    setAlert('');
    setMessage('');

    if (imageUrls.length === 0) {
      setAlert('Please upload at least one product image.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post('/api/products', {
        title: values.title.trim(),
        description: values.description.trim(),
        price: values.price,
        currency: values.currency,
        inventory: values.inventory,
        category: values.category,
        images: imageUrls,
      });

      setMessage('Product created successfully');
      navigate('/dashboard');
      reset({
        title: '',
        description: '',
        price: '',
        currency: 'SEK',
        inventory: '',
        category: '',
      });
      setImageUrls([]);
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors?.length) {
        const fieldErrors = {};
        backendErrors.forEach(({ field, message }) => {
          fieldErrors[field] = message;
        });
        Object.entries(fieldErrors).forEach(([field, message]) => {
          setFieldError(field, { type: 'server', message });
        });
        setAlert('Please fix the errors above.');
      } else {
        setAlert(err.response?.data?.message || 'Failed to create product.');
      }
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || isSubmitting;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {}}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <span className="mr-2">&larr;</span> Back to dashboard
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
      <p className="text-sm text-gray-500">
        Publish a new product to your store. All fields are required unless noted.
      </p>

      {message && (
        <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}
       <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-5" noValidate>
          <div>
          <p className="mb-2 font-bold text-gray-900">Listing Type</p>
         <div className="flex gap-4">
           <label className="flex items-center gap-2">
             <input type="radio" name="transactionType" value="sell" checked={transactionType === 'sell'} onChange={() => setTransactionType('sell')} />
             selling
           </label>
           <label className="flex items-center gap-2">
             <input type="radio" name="transactionType" value="given" checked={transactionType === 'given'} onChange={() => setTransactionType('given')} className="accent-blue-600" />
             Given away
           </label>
         </div>
       </div>

       <ImageUpload
            key="new"
            label="Product images"
            multiple
            initialUrls={imageUrls}
            onChange={() => {}}
            onImagesChange={setImageUrls}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="add-product-title" className="mb-1.5 block text-sm font-medium text-gray-700">
                Product title
              </label>
              <input
                id="add-product-title"
                {...register('title')}
                placeholder="Enter product title"
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {errors.title && (
                <p className="mt-1.5 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="add-product-description" className="mb-1.5 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="add-product-description"
                {...register('description')}
                rows={4}
                placeholder="Describe your product (optional)"
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {errors.description && (
                <p className="mt-1.5 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <div className="mb-1.5 block text-sm font-medium text-gray-700">Price</div>
              <div className="relative w-full">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium"
                >
                  {CURRENCY_SYMBOLS[watch('currency', 'SEK')] || '$'}
                </span>
                <input
                  id="add-product-price"
                  {...register('price')}
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                {errors.price && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="add-product-currency" className="mb-1.5 block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                id="add-product-currency"
                {...register('currency')}
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="add-product-inventory" className="mb-1.5 block text-sm font-medium text-gray-700">
                Stock quantity
              </label>
              <input
                id="add-product-inventory"
                {...register('inventory')}
                type="number"
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {errors.inventory && (
                <p className="mt-1.5 text-sm text-red-600">{errors.inventory.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="add-product-category" className="mb-1.5 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="add-product-category"
                {...register('category')}
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1.5 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isInvalid || busy}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {busy ? 'Publishing...' : 'Publish product'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
