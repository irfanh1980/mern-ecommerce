import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { SUBCATEGORIES, PRODUCT_TYPES } from '../constants/categories.js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, CATEGORIES, CURRENCIES, CURRENCY_SYMBOLS, LISTING_TYPES } from '../validators/productSchema.js';
import ImageManager from '../components/ui/ImageManager.jsx';
import CategoryAttributesFields from '../components/product/CategoryAttributesFields.jsx';
import SearchableSelect from '../components/ui/SearchableSelect.jsx';
import { filterAttributesForCategory } from '../constants/categoryAttributes.js';

export default function AddProduct() {
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const [attributes, setAttributes] = useState({});

  const {
    register,
    handleSubmit,
    formState: { errors, isInvalid, isSubmitting },
    reset,
    setError: setFieldError,
    setValue,
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
      subcategory: '',
      productType: '',
      condition: '',
      listingType: 'selling',
    },
  });

  const listingType = watch('listingType');
  const isFree = listingType === 'given';

  const onInvalid = () => {
    setMessage('Please fix the highlighted errors.');
  };

  useEffect(() => {
    if (listingType === 'given') {
      setValue('price', 0);
    } else {
      const p = watch('price');
      if (p === 0 || p === '0') setValue('price', '');
    }
  }, [listingType, setValue]);

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
          productType: p.productType || '',
          condition: p.condition || '',
          listingType: p.listingType || 'selling',
        });
        setAttributes(p.attributes || {});
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
        currency: values.currency,
        inventory: values.inventory,
        category: values.category,
        subcategory: values.subcategory,
        productType: values.productType,
        condition: values.condition,
        listingType: values.listingType,
        price: values.listingType === 'given' ? 0 : values.price,
        attributes: filterAttributesForCategory(values.category, attributes),
        images: images.map((img) => ({ url: img.previewUrl, public_id: img.public_id || '', caption: img.caption || '' })),
      });

      setMessage('Product created successfully');
      navigate('/seller/my-profile');
      reset({
        title: '',
        description: '',
        price: '',
        currency: 'SEK',
        inventory: '',
      category: '',
      subcategory: '',
      productType: '',
      condition: '',
      listingType: 'selling',
      });
      setImages([]);
      setAttributes({});
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
          onClick={() => navigate('/seller/my-profile')}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <span className="mr-2">&larr;</span> Back to my profile
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
            <label htmlFor="add-product-listing-type" className="mb-1.5 block text-sm font-medium text-gray-700">
              Listing type
            </label>
            <select
              id="add-product-listing-type"
              {...register('listingType')}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {LISTING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
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
              {isFree ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">
                  Free — price set to 0 SEK
                </div>
              ) : (
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
              )}
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
                min="0"
                step="1"
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {errors.inventory && (
                <p className="mt-1.5 text-sm text-red-600">{errors.inventory.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="add-product-gender" className="mb-1.5 block text-sm font-medium text-gray-700">
                Sex/Gender
              </label>
              <select
                id="add-product-gender"
                value={attributes.gender || ''}
                onChange={(e) => setAttributes((prev) => ({ ...prev, gender: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select gender</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
                <option value="Kids">Kids</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="add-product-category" className="mb-1.5 block text-sm font-medium text-gray-700">
                Category
              </label>
              <SearchableSelect
                id="add-product-category"
                value={watch('category')}
                onChange={(v) => {
                  setValue('category', v);
                  setValue('subcategory', '');
                  setValue('productType', '');
                  setAttributes({});
                }}
                options={CATEGORIES}
                allowCustom={false}
                placeholder="Search category…"
                inputClass="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
               {errors.category && (
                <p className="mt-1.5 text-sm text-red-600">{errors.category.message}</p>
               )}
             </div>
{watch('category') && (
              <div className="sm:col-span-2">
                <label htmlFor="add-product-subcategory" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Subcategory
                </label>
                <SearchableSelect
                  id="add-product-subcategory"
                  value={watch('subcategory')}
                  onChange={(v) => {
                    setValue('subcategory', v, { shouldValidate: true });
                    setValue('productType', '');
                  }}
                  options={SUBCATEGORIES[watch('category')] || []}
                  allowCustom={false}
                  placeholder="Search subcategory…"
                  inputClass="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              )}
              {watch('subcategory') && (PRODUCT_TYPES[watch('category')]?.[watch('subcategory')] || []).length > 0 && (
              <div className="sm:col-span-2">
                <label htmlFor="add-product-type" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Product type
                </label>
                <SearchableSelect
                  id="add-product-type"
                  value={watch('productType')}
                  onChange={(v) => setValue('productType', v, { shouldValidate: true })}
                  options={PRODUCT_TYPES[watch('category')]?.[watch('subcategory')] || []}
                  allowCustom={false}
                  placeholder="Search product type…"
                  inputClass="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
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
                  <option value="">Select condition</option>
                  <option value="brand_new">Brand new - unopened/with price tag</option>
                 <option value="like_new">Like new - no visible signs of wear</option>
                 <option value="used_good">Used - but in good condition</option>
                 <option value="used_wear">Used - with visible signs of wear</option>
                  <option value="needs_repair">Needs repair</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <CategoryAttributesFields
                  category={watch('category')}
                  attributes={attributes}
                  onChange={setAttributes}
                />
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
