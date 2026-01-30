'use client';

import { ChangeEvent } from 'react';
import type { ExpectedValues, BeverageType } from '@/lib/types';
import { styles } from './ApplicationDataForm.styles';

interface ApplicationDataFormProps {
  values: ExpectedValues;
  onChange: (values: ExpectedValues) => void;
  disabled?: boolean;
}

export default function ApplicationDataForm({
  values,
  onChange,
  disabled = false,
}: ApplicationDataFormProps) {
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    onChange({
      ...values,
      [name]: value,
    });
  };

  const handleBeverageTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...values,
      beverageType: e.target.value as BeverageType,
    });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Application Data</h2>
      <p className={styles.description}>
        Enter the expected values from the COLA application
      </p>

      <div className={styles.formFields}>
        {/* Brand Name */}
        <div>
          <label htmlFor="brandName" className={styles.fieldContainer}>
            Brand Name <span className={styles.requiredMark}>*</span>
          </label>
          <input
            type="text"
            id="brandName"
            name="brandName"
            value={values.brandName}
            onChange={handleChange}
            disabled={disabled}
            placeholder="e.g., OLD TOM DISTILLERY"
            className={styles.input}
            required
          />
        </div>

        {/* Class/Type */}
        <div>
          <label htmlFor="classType" className={styles.fieldContainer}>
            Class/Type <span className={styles.requiredMark}>*</span>
          </label>
          <input
            type="text"
            id="classType"
            name="classType"
            value={values.classType}
            onChange={handleChange}
            disabled={disabled}
            placeholder="e.g., Kentucky Straight Bourbon Whiskey"
            className={styles.input}
            required
          />
        </div>

        {/* Alcohol Content */}
        <div>
          <label
            htmlFor="alcoholContent"
            className={styles.fieldContainer}
          >
            Alcohol Content <span className={styles.requiredMark}>*</span>
          </label>
          <input
            type="text"
            id="alcoholContent"
            name="alcoholContent"
            value={values.alcoholContent}
            onChange={handleChange}
            disabled={disabled}
            placeholder="e.g., 45% Alc./Vol. or 45% ABV"
            className={styles.input}
            required
          />
        </div>

        {/* Net Contents */}
        <div>
          <label htmlFor="netContents" className={styles.fieldContainer}>
            Net Contents <span className={styles.requiredMark}>*</span>
          </label>
          <input
            type="text"
            id="netContents"
            name="netContents"
            value={values.netContents}
            onChange={handleChange}
            disabled={disabled}
            placeholder="e.g., 750 mL"
            className={styles.input}
            required
          />
        </div>

        {/* Producer Name & Address */}
        <div>
          <label
            htmlFor="producerNameAddress"
            className={styles.fieldContainer}
          >
            Producer Name & Address <span className={styles.requiredMark}>*</span>
          </label>
          <textarea
            id="producerNameAddress"
            name="producerNameAddress"
            value={values.producerNameAddress}
            onChange={handleChange}
            disabled={disabled}
            placeholder="e.g., Old Tom Distillery, Louisville, KY"
            rows={2}
            className={styles.textarea}
            required
          />
        </div>

        {/* Country of Origin */}
        <div>
          <label
            htmlFor="countryOfOrigin"
            className={styles.fieldContainer}
          >
            Country of Origin <span className={styles.optionalMark}>(Optional - for imports)</span>
          </label>
          <input
            type="text"
            id="countryOfOrigin"
            name="countryOfOrigin"
            value={values.countryOfOrigin || ''}
            onChange={handleChange}
            disabled={disabled}
            placeholder="e.g., Germany"
            className={styles.input}
          />
        </div>

        {/* Beverage Type */}
        <div>
          <label htmlFor="beverageType" className={styles.fieldContainer}>
            Beverage Type <span className={styles.requiredMark}>*</span>
          </label>
          <select
            id="beverageType"
            name="beverageType"
            value={values.beverageType}
            onChange={handleBeverageTypeChange}
            disabled={disabled}
            className={styles.select}
            required
          >
            <option value="spirits">Distilled Spirits</option>
            <option value="wine">Wine</option>
            <option value="beer">Beer</option>
          </select>
        </div>
      </div>
    </div>
  );
}
