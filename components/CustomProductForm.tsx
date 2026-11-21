'use client';

import { useRef, useState } from 'react';
import { validateCasNumber } from '@/lib/validators';
import { PAGE_CONTAINER_CLASS } from '@/lib/layout';

import {
  CloudUpload,
  RotateCcw,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function CustomProductForm() {
  const [formData, setFormData] = useState({
    productName: '',
    casNo: '',
    molecularFormula: '',
    detailedRequirement: '',
    purity: '',
    quantity: '',
    quantityUnit: 'KG',
    packSize: '',
    application: '',
    deliveryLocation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [file, setFile] =
    useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [message, setMessage] = useState({
    type: '',
    text: '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0] || null;
    e.target.value = '';
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleCasBlur = () => {
    const trimmedCas = formData.casNo.trim();
    if (!trimmedCas) {
      setErrors((prev) => ({ ...prev, casNo: '' }));
      return;
    }

    const casError = validateCasNumber(trimmedCas);
    setErrors((prev) => ({
      ...prev,
      casNo: casError || '',
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.productName.trim()) {
      newErrors.productName =
        'Product name is required';
    }

    if (formData.casNo.trim()) {
      const casError = validateCasNumber(formData.casNo.trim());
      if (casError) {
        newErrors.casNo = casError;
      }
    }

    if (!formData.purity) {
      newErrors.purity =
        'Purity is required';
    }

    if (!formData.application) {
      newErrors.application =
        'Application is required';
    }

    if (!formData.quantity) {
      newErrors.quantity =
        'Quantity is required';
    }

    if (!formData.deliveryLocation.trim()) {
      newErrors.deliveryLocation =
        'Delivery location is required';
    }

    if (
      !formData.detailedRequirement.trim()
    ) {
      newErrors.detailedRequirement =
        'Detailed specification is required';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleReset = () => {
    setFormData({
      productName: '',
      casNo: '',
      molecularFormula: '',
      detailedRequirement: '',
      purity: '',
      quantity: '',
      quantityUnit: 'KG',
      packSize: '',
      application: '',
      deliveryLocation: '',
    });

    setErrors({});

    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setMessage({
      type: '',
      text: '',
    });
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setMessage({
      type: '',
      text: '',
    });

    if (!validateForm()) {
      setMessage({
        type: 'error',
        text:
          'Please fix the highlighted errors before submitting.',
      });

      return;
    }

    try {
      setIsSubmitting(true);

      const data = new FormData();

      Object.entries(formData).forEach(
        ([key, value]) => {
          data.append(key, value);
        }
      );

      if (file) {
        data.append('attachment', file);
      }

      const res = await fetch(
        '/api/custom-requirement',
        {
          method: 'POST',
          body: data,
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setMessage({
          type: 'error',
          text:
            result.error ||
            'Submission failed',
        });

        return;
      }

      setMessage({
        type: 'success',
        text:
          'Requirement submitted successfully.',
      });

      setFormData({
        productName: '',
        casNo: '',
        molecularFormula: '',
        detailedRequirement: '',
        purity: '',
        quantity: '',
        quantityUnit: 'KG',
        packSize: '',
        application: '',
        deliveryLocation: '',
      });

      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setErrors({});
    } catch (error) {
      console.log(error);

      setMessage({
        type: 'error',
        text:
          'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full h-[48px] rounded-md border border-border bg-surface-elevated px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted focus:border-primary';

  const errorInputClass =
    'border-red-500 focus:border-red-500';

  const labelClass =
    'mb-2 block text-sm font-medium text-foreground';

  const errorTextClass =
    'mt-1 text-xs text-red-500';

  return (
    <section className="w-full bg-background py-10 text-foreground">

      <div className={PAGE_CONTAINER_CLASS}>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xl lg:p-10 theme-light:shadow-md">

          {/* HEADER */}
          <div className="mb-5 flex flex-col items-center text-center">

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold uppercase tracking-wide">
              Submit Your Requirement
            </h2>

            <p className="mt-2 text-sm text-muted">
              Please provide as much detail as possible.
            </p>

          </div>

          {/* SUCCESS / ERROR MESSAGE */}
          {message.text && (
            <div
              className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'border-green-600/35 bg-green-500/10 text-green-700 theme-dark:text-green-400'
                  : 'border-red-600/35 bg-red-500/10 text-red-700 theme-dark:text-red-400'
              }`}
            >

              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}

              <span>{message.text}</span>

            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-12"
          >

            {/* PRODUCT NAME */}
            <div className="lg:col-span-4">

              <label className={labelClass}>
                Product Name / Chemical Name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="Enter product or chemical name"
                className={`${inputClass} ${
                  errors.productName
                    ? errorInputClass
                    : ''
                }`}
              />

              {errors.productName && (
                <p className={errorTextClass}>
                  {errors.productName}
                </p>
              )}

            </div>

            {/* PURITY */}
            <div className="lg:col-span-4">

              <label className={labelClass}>
                Required Purity / Grade
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                name="purity"
                value={formData.purity}
                onChange={handleChange}
                className={`${inputClass} ${
                  errors.purity
                    ? errorInputClass
                    : ''
                }`}
              >

                <option value="">
                  Select purity
                </option>

                <option>99%</option>
                <option>99.5%</option>
                <option>99.9%</option>

              </select>

              {errors.purity && (
                <p className={errorTextClass}>
                  {errors.purity}
                </p>
              )}

            </div>

            {/* APPLICATION */}
            <div className="lg:col-span-4">

              <label className={labelClass}>
                Intended Application
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                name="application"
                value={formData.application}
                onChange={handleChange}
                className={`${inputClass} ${
                  errors.application
                    ? errorInputClass
                    : ''
                }`}
              >

                <option value="">
                  Select application
                </option>

                <option>Industrial</option>
                <option>Research</option>
                <option>Pharmaceutical</option>

              </select>

              {errors.application && (
                <p className={errorTextClass}>
                  {errors.application}
                </p>
              )}

            </div>

            {/* CAS */}
            <div className="lg:col-span-4">

              <label className={labelClass}>
                CAS No. (if known)
              </label>

              <input
                type="text"
                name="casNo"
                value={formData.casNo}
                onChange={handleChange}
                onBlur={handleCasBlur}
                placeholder="e.g. 67-64-1"
                className={`${inputClass} ${
                  errors.casNo
                    ? errorInputClass
                    : ''
                }`}
              />

              {errors.casNo ? (
                <p className={errorTextClass}>
                  {errors.casNo}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted">
                  Format: e.g. 00-00-0 or 67-64-1
                </p>
              )}

            </div>

            {/* QUANTITY */}
            <div className="lg:col-span-4">

              <label className={labelClass}>
                Quantity Required
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="flex gap-3">

                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  className={`${inputClass} min-w-0 flex-1 ${
                    errors.quantity
                      ? errorInputClass
                      : ''
                  }`}
                />

                <select
                  name="quantityUnit"
                  value={
                    formData.quantityUnit
                  }
                  onChange={handleChange}
                  className="h-[48px] w-[110px] rounded-md border border-border bg-surface-elevated px-3 text-sm text-foreground outline-none"
                >

                  <option>KG</option>
                  <option>GM</option>
                  <option>L</option>
                  <option>Ton</option>

                </select>

              </div>

              {errors.quantity && (
                <p className={errorTextClass}>
                  {errors.quantity}
                </p>
              )}

            </div>

            {/* DELIVERY */}
            <div className="lg:col-span-4">

              <label className={labelClass}>
                Delivery Location
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                name="deliveryLocation"
                value={
                  formData.deliveryLocation
                }
                onChange={handleChange}
                placeholder="Enter location"
                className={`${inputClass} ${
                  errors.deliveryLocation
                    ? errorInputClass
                    : ''
                }`}
              />

              {errors.deliveryLocation && (
                <p className={errorTextClass}>
                  {errors.deliveryLocation}
                </p>
              )}

            </div>

            {/* FORMULA */}
            <div className="lg:col-span-4">

              <label className={labelClass}>
                Molecular Formula
              </label>

              <input
                type="text"
                name="molecularFormula"
                value={
                  formData.molecularFormula
                }
                onChange={handleChange}
                placeholder="Enter formula"
                className={inputClass}
              />

            </div>

            {/* PACK SIZE */}
            <div className="lg:col-span-4">

              <label className={labelClass}>
                Pack Size
              </label>

              <input
                type="text"
                name="packSize"
                value={formData.packSize}
                onChange={handleChange}
                placeholder="Enter pack size"
                className={inputClass}
              />

            </div>

            {/* UPLOAD */}
            <div className="lg:col-span-4 lg:row-span-2">

              <label className={labelClass}>
                Additional Attachments
              </label>

              <label className="flex h-[155px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface-elevated px-4 text-center">

                <CloudUpload className="mb-3 h-8 w-8 text-primary" />

                <p className="text-sm text-foreground">
                  Drag & drop or browse files
                </p>

                <p className="mt-2 text-xs text-muted">
                  PDF, DOC, XLS, Images
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={handleFileChange}
                />

              </label>

              {file && (
                <p className="mt-2 text-xs text-primary">
                  {file.name}
                </p>
              )}

            </div>

            {/* SPECIFICATION */}
            <div className="lg:col-span-8">

              <label className={labelClass}>
                Detailed Requirement /
                Specification
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <textarea
                rows={5}
                name="detailedRequirement"
                value={
                  formData.detailedRequirement
                }
                onChange={handleChange}
                placeholder="Please provide detailed specification..."
                className={`min-h-[120px] w-full rounded-md border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted ${
                  errors.detailedRequirement
                    ? 'border-red-500'
                    : 'border-border'
                }`}
              />

              {errors.detailedRequirement && (
                <p className={errorTextClass}>
                  {
                    errors.detailedRequirement
                  }
                </p>
              )}

            </div>

            {/* BUTTONS */}
            <div className="flex flex-col-reverse sm:flex-row justify-center gap-3 sm:gap-4 lg:col-span-12">

              <button
                type="button"
                onClick={handleReset}
                className="flex h-[46px] items-center justify-center gap-2 rounded-md border border-border px-6 text-sm font-medium text-foreground transition-all hover:bg-surface-elevated"
              >

                <RotateCcw className="h-4 w-4" />

                Reset

              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-[46px] items-center justify-center gap-2 rounded-md bg-primary px-7 text-sm font-medium text-white transition-all hover:bg-primary-hover"
              >

                <Send className="h-4 w-4" />

                {isSubmitting
                  ? 'Submitting...'
                  : 'Submit Requirement'}

              </button>

            </div>

          </form>

        </div>

      </div>

    </section>
  );
}
