import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { SUBCATEGORIES } from '../constants/categories.js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, CATEGORIES, CURRENCIES, CURRENCY_SYMBOLS } from '../validators/productSchema.js';
import ImageManager from '../components/ui/ImageManager.jsx';

export default function AddProduct() {
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [transactionType, setTransactionType] = useState('given');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);

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
    setMessage('Please fix the highlighted errors.');
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const { data } = await api.get(`/api/products/${id}`);
        const p = data.data;
        reset({
          title: p.title,
          description: p.description,
          price: p.price,
          currency: p.currency,
          inventory: p.inventory,
          category: p.category,
          subcategory: p.subcategory || '',
          condition: p.condition || 'used_good',
        });
        setImages(p.images || []);
      } catch (e) {}
    };
    load();
  }, [id, api, reset]);

  const onValid = async (values) => {
    setMessage('');
    setMessage('');

    if (images.length === 0) {
      setMessage('Please upload at least one product image.');
      return;
    }

    setSaving(true);
    try {
      const method = id ? 'put' : 'post';
      const url = id ? `/api/products/${id}` : '/api/products';
      const { data } = await api[method](url, {
        title: values.title.trim(),
        description: values.description.trim(),
        price: values.price,
        currency: values.currency,
        inventory: values.inventory,
        category: values.category,
        subcategory: values.subcategory,
        condition: values.condition,
        images: images.map((img) => ({ url: img.previewUrl, public_id: img.public_id || '', caption: img.caption || '' })),
      });

      setMessage('Product created successfully');
      navigate('/seller/dashboard');
      reset({
        title: '',
        description: '',
        price: '',
        currency: 'SEK',
        inventory: '',
      category: '',
      subcategory: '',
      condition: 'used_good',
      });
      setImages([]);
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
        setMessage('Please fix the errors above.');
      } else {
        setMessage(err.response?.data?.message || 'Failed to create product.');
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
          onClick={() => navigate('/seller/dashboard')}
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

        <ImageManager onChange={setImages} />

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
             {watch('category') && (
             <div className="sm:col-span-2">
               <label htmlFor="add-product-subcategory" className="mb-1.5 block text-sm font-medium text-gray-700">
                 Subcategory
               </label>
               <select
                 id="add-product-subcategory"
                 {...register('subcategory')}
                 className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
               >
                 <option value="">Select a subcategory</option>
                 {(SUBCATEGORIES[watch('category')] || []).map((s) => (
                   <option key={s} value={s}>{s}</option>
                 ))}
               </select>
             </div>
             )}
              <div className="sm:col-span-2">
                <label htmlFor="add-product-condition" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Condition
                </label>
               <select
                 id="add-product-condition"
                 {...register('condition')}
                 className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
               >
                 <option value="brand_new">Brand new - unopened/with price tag</option>
                 <option value="like_new">Like new - no visible signs of wear</option>
                 <option value="used_good">Used - but in good condition</option>
                 <option value="used_wear">Used - with visible signs of wear</option>
                 <option value="needs_repair">Needs repair</option>
               </select>
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
