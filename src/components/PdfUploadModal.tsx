// components/PdfUploadModal.tsx - Enhanced Version with JSON Import
'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Modal from './modal';
import Button from './button';
import Input from './customInput';
import Dropdown, { DropdownOption } from './dropdown';
import { FaPlus, FaTrash, FaSave, FaUpload, FaCode } from 'react-icons/fa';

interface BatteryData {
  name: string;
  plate?: string | number; // Optional for Battery Tonic
  ah?: number; // Optional for Battery Tonic
  type?: string;
  retailPrice?: number;
  salesTax?: number; // Optional for Battery Tonic
  maxRetailPrice?: number; // Will be calculated automatically
  batteryType?: 'battery' | 'tonic'; // Track the battery type
}

interface ProductData {
  name: string;
  plate?: number; // Optional for Battery Tonic
  ah?: number; // Optional for Battery Tonic
  retailPrice: number;
  salesTax?: number; // Optional for Battery Tonic
  maxRetailPrice?: number;
  batteryType?: 'battery' | 'tonic'; // Track the battery type
}

interface JsonUploadData {
  brandName: string;
  salesTax: number;
  products: {
    [key: string]: ProductData;
  };
}

interface PdfUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: {
    brandName: string;
    series: BatteryData[];
    salesTax: string;
    batteryType: 'battery' | 'tonic';
  }) => void;
  brands: { label: string; value: string }[];
  categories?: { brandName: string; series: any[] }[];
}

const PdfUploadModal: React.FC<PdfUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  brands,
  categories,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'json'>('manual');
  const [batteryType, setBatteryType] = useState<'battery' | 'tonic'>(
    'battery'
  );
  const [selectedBrand, setSelectedBrand] = useState<DropdownOption | null>(
    null
  );
  const [salesTax, setSalesTax] = useState<string>('18');
  const [batteryData, setBatteryData] = useState<BatteryData[]>([
    batteryType === 'battery'
      ? { name: '', plate: '', ah: 0, retailPrice: 0, batteryType }
      : { name: 'Battery Tonic', retailPrice: 0, batteryType },
  ]);
  const [jsonData, setJsonData] = useState<string>('');

  // Update sales tax when battery type changes
  useEffect(() => {
    if (batteryType === 'tonic') {
      setSalesTax('0'); // Battery Tonic has no sales tax
    } else {
      setSalesTax('18'); // Default sales tax for battery data
    }
  }, [batteryType]);

  // Update battery type in existing battery data when toggle changes
  useEffect(() => {
    setBatteryData((prevData) =>
      prevData.map((battery) => ({
        ...battery,
        batteryType,
        name: batteryType === 'tonic' ? 'Battery Tonic' : battery.name,
      }))
    );
  }, [batteryType]);

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'import' | 'clear' | 'loadSample' | 'loadFull' | 'updateCategory';
    data?: any;
  } | null>(null);
  const [showFixedJsonModal, setShowFixedJsonModal] = useState<boolean>(false);
  const [fixedJsonData, setFixedJsonData] = useState<string>('');
  const [showUpdateCategoryModal, setShowUpdateCategoryModal] =
    useState<boolean>(false);
  const [updateCategoryData, setUpdateCategoryData] = useState<{
    brandName: string;
    seriesCount: number;
    action: () => void;
  } | null>(null);

  const handleBrandSelect = (option: DropdownOption) => {
    setSelectedBrand(option);
  };

  const handleSalesTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (/^\d*\.?\d*$/.test(value)) {
      setSalesTax(value);
    }
  };

  const addBatteryRow = () => {
    setBatteryData([
      ...batteryData,
      batteryType === 'battery'
        ? { name: '', plate: '', ah: 0, retailPrice: 0, batteryType }
        : { name: 'Battery Tonic', retailPrice: 0, batteryType },
    ]);
  };

  const removeBatteryRow = (index: number) => {
    if (batteryData.length > 1) {
      const newData = batteryData.filter((_, i) => i !== index);
      setBatteryData(newData);
    }
  };

  const updateBatteryData = (
    index: number,
    field: keyof BatteryData,
    value: string | number
  ) => {
    const newData = [...batteryData];
    newData[index] = { ...newData[index], [field]: value };
    setBatteryData(newData);
  };

  const parseJsonData = (jsonString: string): JsonUploadData | null => {
    try {
      // Trim whitespace and check if empty
      const trimmedJson = jsonString.trim();
      if (!trimmedJson) {
        throw new Error('JSON data is empty');
      }

      const parsed = JSON.parse(trimmedJson);

      // Validate the structure
      if (!parsed.brandName || !parsed.salesTax || !parsed.products) {
        throw new Error(
          'Invalid data structure. Must include brandName, salesTax, and products.'
        );
      }

      // Validate products structure
      const products = parsed.products;
      if (typeof products !== 'object' || products === null) {
        throw new Error('Products must be an object');
      }

      for (const [key, product] of Object.entries(products)) {
        if (!product || typeof product !== 'object') {
          throw new Error(`Invalid product data for key: ${key}`);
        }

        const requiredFields = [
          'name',
          'plate',
          'ah',
          'retailPrice',
          'salesTax',
        ];
        for (const field of requiredFields) {
          if (!(field in product)) {
            throw new Error(`Product ${key} missing required field: ${field}`);
          }
        }
      }

      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `JSON syntax error: ${error.message}. Please check for missing quotes, commas, or brackets.`
        );
      }
      throw new Error(
        `JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const convertJsonToBatteryData = (
    jsonData: JsonUploadData,
    batteryType: 'battery' | 'tonic' = 'battery'
  ): BatteryData[] => {
    return Object.values(jsonData.products).map((product) => {
      // Calculate sales tax amount based on the global salesTax percentage
      const salesTaxAmount =
        batteryType === 'battery'
          ? (product.retailPrice * jsonData.salesTax) / 100
          : 0;

      // Calculate max retail price (retail price + sales tax)
      const maxRetailPrice = product.retailPrice + salesTaxAmount;

      return {
        name: product.name,
        plate: batteryType === 'battery' ? product.plate : undefined,
        ah: batteryType === 'battery' ? product.ah : undefined,
        retailPrice: product.retailPrice,
        salesTax: batteryType === 'battery' ? jsonData.salesTax : 0, // Battery Tonic doesn't have sales tax
        maxRetailPrice: Math.round(maxRetailPrice * 100) / 100, // Round to 2 decimal places
        batteryType,
      };
    });
  };

  const fixJsonSyntax = (jsonString: string): string => {
    let fixed = jsonString.trim();

    // Remove any BOM characters
    fixed = fixed.replace(/^\uFEFF/, '');

    // 1. Remove all comments (single line and multi-line)
    fixed = fixed.replace(/\/\/.*$/gm, ''); // Remove single line comments
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

    // 2. Remove trailing commas before closing brackets/braces
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    // 3. Fix missing quotes around ALL property names (including nested ones)
    // This regex catches property names that are not already quoted
    fixed = fixed.replace(
      /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_\s\/\-\(\)]*)\s*:/g,
      (match, prefix, propName) => {
        const trimmed = propName.trim();
        // Don't quote if it's already quoted
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          return match;
        }
        // Don't quote if it's a number
        if (!isNaN(Number(trimmed))) {
          return match;
        }
        return `${prefix}"${trimmed}":`;
      }
    );

    // 4. Fix single quotes to double quotes
    fixed = fixed.replace(/'/g, '"');

    // 5. Fix missing quotes around string values that should be quoted
    fixed = fixed.replace(
      /:\s*([a-zA-Z][a-zA-Z0-9\s\/\-\(\)\.]+)(\s*[,}])/g,
      (match, value, suffix) => {
        const trimmed = value.trim();
        // Don't quote if it's already quoted
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          return match;
        }
        // Don't quote if it's a number
        if (!isNaN(Number(trimmed))) {
          return match;
        }
        // Don't quote if it's a boolean
        if (trimmed === 'true' || trimmed === 'false') {
          return match;
        }
        // Don't quote if it's null
        if (trimmed === 'null') {
          return match;
        }
        return `: "${trimmed}"${suffix}`;
      }
    );

    // 6. Clean up extra whitespace and newlines
    fixed = fixed.replace(/\s+/g, ' ');

    // 7. Ensure proper spacing around colons and commas
    fixed = fixed.replace(/\s*:\s*/g, ': ');
    fixed = fixed.replace(/\s*,\s*/g, ', ');

    // 8. Multiple passes to catch any remaining unquoted property names
    for (let i = 0; i < 3; i++) {
      fixed = fixed.replace(
        /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_\s\/\-\(\)]*)\s*:/g,
        (match, prefix, propName) => {
          const trimmed = propName.trim();
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return match;
          }
          if (!isNaN(Number(trimmed))) {
            return match;
          }
          return `${prefix}"${trimmed}":`;
        }
      );
    }

    // 9. Multiple passes to catch any remaining unquoted string values
    for (let i = 0; i < 3; i++) {
      fixed = fixed.replace(
        /:\s*([a-zA-Z][a-zA-Z0-9\s\/\-\(\)\.]+)(\s*[,}])/g,
        (match, value, suffix) => {
          const trimmed = value.trim();
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return match;
          }
          if (!isNaN(Number(trimmed))) {
            return match;
          }
          if (trimmed === 'true' || trimmed === 'false' || trimmed === 'null') {
            return match;
          }
          return `: "${trimmed}"${suffix}`;
        }
      );
    }

    // 10. Final cleanup - remove any double spaces
    fixed = fixed.replace(/\s{2,}/g, ' ');

    return fixed;
  };

  const handleJsonUpload = () => {
    if (!jsonData.trim()) {
      toast.error('Please paste JSON data');
      return;
    }

    try {
      const parsedData = parseJsonData(jsonData);
      if (!parsedData) {
        toast.error('Failed to parse JSON data');
        return;
      }

      // Check if brand exists in dropdown options
      const brandExists = brands.some(
        (brand) => brand.label === parsedData.brandName
      );
      if (!brandExists) {
        toast.error(
          `Brand "${parsedData.brandName}" not found in available brands. Please add it first.`
        );
        return;
      }

      const existingCategory = categories?.find(
        (cat) => cat.brandName === parsedData.brandName
      );

      if (existingCategory) {
        setUpdateCategoryData({
          brandName: parsedData.brandName,
          seriesCount: existingCategory.series?.length || 0,
          action: () => {
            const batteryData = convertJsonToBatteryData(
              parsedData,
              batteryType
            );
            onSuccess({
              brandName: parsedData.brandName,
              series: batteryData,
              salesTax: parsedData.salesTax.toString(),
              batteryType,
            });
            handleClose();
          },
        });
        setShowUpdateCategoryModal(true);
        return;
      }

      const batteryData = convertJsonToBatteryData(parsedData, batteryType);

      onSuccess({
        brandName: parsedData.brandName,
        series: batteryData,
        salesTax: parsedData.salesTax.toString(),
        batteryType,
      });

      handleClose();
    } catch (error) {
      // Try to fix the JSON automatically
      try {
        const fixedJson = fixJsonSyntax(jsonData);
        const parsedData = parseJsonData(fixedJson);

        if (parsedData) {
          // Ask user if they want to use the fixed version
          setUpdateCategoryData({
            brandName: 'JSON Fix',
            seriesCount: 0,
            action: () => {
              setJsonData(fixedJson);
              toast.success(
                'JSON has been fixed automatically. Please try importing again.'
              );
            },
          });
          setShowUpdateCategoryModal(true);
          return;
        }
      } catch (fixError) {
        // If fixing also fails, show the original error
      }

      toast.error(
        error instanceof Error ? error.message : 'Failed to process JSON data'
      );
    }
  };

  const handleManualSave = () => {
    if (!selectedBrand) {
      toast.error('Please select a brand');
      return;
    }

    if (batteryType === 'battery' && (!salesTax || isNaN(Number(salesTax)))) {
      toast.error('Please enter a valid sales tax percentage');
      return;
    }

    // Filter out empty rows and calculate maxRetailPrice
    const validData = batteryData
      .filter((item) => {
        if (batteryType === 'tonic') {
          // For Battery Tonic, only require name and retailPrice
          return item.name.trim() && item.name === 'Battery Tonic';
        } else {
          // For regular batteries, require name, plate, and ah
          return item.name.trim() && item.plate && (item.ah || 0) > 0;
        }
      })
      .map((item) => {
        const salesTaxAmount =
          batteryType === 'tonic'
            ? 0
            : (item.retailPrice || 0) * (Number(salesTax) / 100);
        const maxRetailPrice = (item.retailPrice || 0) + salesTaxAmount;

        return {
          ...item,
          maxRetailPrice: Math.round(maxRetailPrice * 100) / 100, // Round to 2 decimal places
          salesTax: batteryType === 'tonic' ? 0 : Number(salesTax),
          batteryType,
        };
      });

    if (validData.length === 0) {
      toast.error('Please add at least one battery entry');
      return;
    }

    const existingCategory = categories?.find(
      (cat) => cat.brandName === selectedBrand.label
    );

    if (existingCategory) {
      setUpdateCategoryData({
        brandName: selectedBrand.label,
        seriesCount: existingCategory.series?.length || 0,
        action: () => {
          onSuccess({
            brandName: selectedBrand.label,
            series: validData,
            salesTax,
            batteryType,
          });
          handleClose();
        },
      });
      setShowUpdateCategoryModal(true);
      return;
    }

    onSuccess({
      brandName: selectedBrand.label,
      series: validData,
      salesTax,
      batteryType,
    });

    handleClose();
  };

  const handleClose = () => {
    setActiveTab('manual');
    setBatteryType('battery');
    setSelectedBrand(null);
    setSalesTax('18');
    setBatteryData([
      { name: '', plate: '', ah: 0, retailPrice: 0, batteryType: 'battery' },
    ]);
    setJsonData('');
    setShowConfirmModal(false);
    setShowFixedJsonModal(false);
    setShowUpdateCategoryModal(false);
    setConfirmAction(null);
    setFixedJsonData('');
    setUpdateCategoryData(null);
    onClose();
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case 'import':
        handleJsonUpload();
        break;
      case 'clear':
        setJsonData('');
        break;
      case 'loadSample':
        setJsonData(sampleJsonData);
        break;
      case 'loadFull':
        setJsonData(fullOsakaBatteriesData);
        break;
    }

    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleShowFixedJson = () => {
    if (jsonData.trim()) {
      try {
        const fixed = fixJsonSyntax(jsonData);
        setFixedJsonData(fixed);
        setShowFixedJsonModal(true);
      } catch (error) {
        toast.error('Failed to fix JSON syntax');
      }
    } else {
      toast.error('Please paste JSON data first');
    }
  };

  const handleUpdateCategoryConfirm = () => {
    if (updateCategoryData) {
      updateCategoryData.action();
      setShowUpdateCategoryModal(false);
      setUpdateCategoryData(null);
    }
  };

  const sampleJsonData = `{
  "brandName": "Osaka Batteries",
  "salesTax": 18,
  "products": {
    "HT 50 R/L": {
      "name": "HT 50 R/L",
      "plate": 7,
      "ah": 24,
      "retailPrice": 6150.00,
      "salesTax": 1107.00
    },
    "HT 50 R/L PLUS": {
      "name": "HT 50 R/L PLUS",
      "plate": 7,
      "ah": 26,
      "retailPrice": 6675.00,
      "salesTax": 1202.00
    },
    "HT 55 R/L": {
      "name": "HT 55 R/L",
      "plate": 9,
      "ah": 30,
      "retailPrice": 7695.00,
      "salesTax": 1385.00
    }
  }
}`;

  const fullOsakaBatteriesData = `{
  "brandName": "Osaka Batteries",
  "salesTax": 18,
  "products": {
    "HT 50 R/L": {
      "name": "HT 50 R/L",
      "plate": 7,
      "ah": 24,
      "retailPrice": 6150.00,
      "salesTax": 1107.00
    },
    "HT 50 R/L PLUS": {
      "name": "HT 50 R/L PLUS",
      "plate": 7,
      "ah": 26,
      "retailPrice": 6675.00,
      "salesTax": 1202.00
    },
    "HT 55 R/L": {
      "name": "HT 55 R/L",
      "plate": 9,
      "ah": 30,
      "retailPrice": 7695.00,
      "salesTax": 1385.00
    },
    "HT 60 R/L": {
      "name": "HT 60 R/L",
      "plate": 9,
      "ah": 34,
      "retailPrice": 7850.00,
      "salesTax": 1413.00,
      "maxRetailPrice": 9263.00
    },
    "HT CR 65 R/L": {
      "name": "HT CR 65 R/L",
      "plate": 11,
      "ah": 40,
      "retailPrice": 8950.00,
      "salesTax": 1611.00,
      "maxRetailPrice": 10561.00
    },
    "HT 70 R/L THIN/THICK": {
      "name": "HT 70 R/L THIN/THICK",
      "plate": 11,
      "ah": 45,
      "retailPrice": 9505.00,
      "salesTax": 1711.00,
      "maxRetailPrice": 11216.00
    },
    "HT 75 R/L THIN/THICK": {
      "name": "HT 75 R/L THIN/THICK",
      "plate": 12,
      "ah": 50,
      "retailPrice": 10625.00,
      "salesTax": 1913.00,
      "maxRetailPrice": 12538.00
    },
    "HT 88 R/L": {
      "name": "HT 88 R/L",
      "plate": 9,
      "ah": 50,
      "retailPrice": 11200.00,
      "salesTax": 2016.00,
      "maxRetailPrice": 13216.00
    },
    "HT 90Z R/L": {
      "name": "HT 90Z R/L",
      "plate": 11,
      "ah": 60,
      "retailPrice": 12790.00,
      "salesTax": 2302.00,
      "maxRetailPrice": 15092.00
    },
    "HT 95 R/L": {
      "name": "HT 95 R/L",
      "plate": 13,
      "ah": 70,
      "retailPrice": 14650.00,
      "salesTax": 2637.00,
      "maxRetailPrice": 17287.00
    },
    "HT 115 PLUS A": {
      "name": "HT 115 PLUS A",
      "plate": 11,
      "ah": 72,
      "retailPrice": 12840.00,
      "salesTax": 2311.00,
      "maxRetailPrice": 15151.00
    },
    "HT 120 R/L": {
      "name": "HT 120 R/L",
      "plate": 13,
      "ah": 80,
      "retailPrice": 14625.00,
      "salesTax": 2633.00,
      "maxRetailPrice": 17258.00
    },
    "HT 125Z R/L": {
      "name": "HT 125Z R/L",
      "plate": 15,
      "ah": 85,
      "retailPrice": 16275.00,
      "salesTax": 2930.00,
      "maxRetailPrice": 19205.00
    },
    "HT 130": {
      "name": "HT 130",
      "plate": 13,
      "ah": 90,
      "retailPrice": 16500.00,
      "salesTax": 2970.00,
      "maxRetailPrice": 19470.00
    },
    "HT 135": {
      "name": "HT 135",
      "plate": 15,
      "ah": 100,
      "retailPrice": 18090.00,
      "salesTax": 3256.00,
      "maxRetailPrice": 21346.00
    },
    "HT 145": {
      "name": "HT 145",
      "plate": 17,
      "ah": 105,
      "retailPrice": 19610.00,
      "salesTax": 3530.00,
      "maxRetailPrice": 23140.00
    },
    "HT 150": {
      "name": "HT 150",
      "plate": 15,
      "ah": 105,
      "retailPrice": 19000.00,
      "salesTax": 3420.00,
      "maxRetailPrice": 22420.00
    },
    "HT 155": {
      "name": "HT 155",
      "plate": 17,
      "ah": 110,
      "retailPrice": 20375.00,
      "salesTax": 3668.00,
      "maxRetailPrice": 24043.00
    },
    "HT 160": {
      "name": "HT 160",
      "plate": 19,
      "ah": 115,
      "retailPrice": 22140.00,
      "salesTax": 3985.00,
      "maxRetailPrice": 26125.00
    },
    "HT 180": {
      "name": "HT 180",
      "plate": 19,
      "ah": 115,
      "retailPrice": 23500.00,
      "salesTax": 4230.00,
      "maxRetailPrice": 27730.00
    },
    "HT 200": {
      "name": "HT 200",
      "plate": 21,
      "ah": 120,
      "retailPrice": 24500.00,
      "salesTax": 4410.00,
      "maxRetailPrice": 28910.00
    },
    "HT 210 PLUS": {
      "name": "HT 210 PLUS",
      "plate": 21,
      "ah": 130,
      "retailPrice": 25000.00,
      "salesTax": 4500.00,
      "maxRetailPrice": 29500.00
    },
    "HT 220": {
      "name": "HT 220",
      "plate": 23,
      "ah": 145,
      "retailPrice": 26650.00,
      "salesTax": 4797.00,
      "maxRetailPrice": 31447.00
    },
    "HT 225": {
      "name": "HT 225",
      "plate": 21,
      "ah": 135,
      "retailPrice": 27750.00,
      "salesTax": 4995.00,
      "maxRetailPrice": 32745.00
    },
    "HT 230": {
      "name": "HT 230",
      "plate": 23,
      "ah": 145,
      "retailPrice": 28600.00,
      "salesTax": 5148.00,
      "maxRetailPrice": 33748.00
    },
    "HT 240 PLUS": {
      "name": "HT 240 PLUS",
      "plate": 23,
      "ah": 155,
      "retailPrice": 28950.00,
      "salesTax": 5211.00,
      "maxRetailPrice": 34161.00
    },
    "HT 260": {
      "name": "HT 260",
      "plate": 25,
      "ah": 175,
      "retailPrice": 32300.00,
      "salesTax": 5814.00,
      "maxRetailPrice": 38114.00
    },
    "HT 270": {
      "name": "HT 270",
      "plate": 27,
      "ah": 180,
      "retailPrice": 34525.00,
      "salesTax": 6215.00,
      "maxRetailPrice": 40740.00
    },
    "HT 280": {
      "name": "HT 280",
      "plate": 27,
      "ah": 180,
      "retailPrice": 35675.00,
      "salesTax": 6422.00,
      "maxRetailPrice": 42097.00
    },
    "HT 290": {
      "name": "HT 290",
      "plate": 31,
      "ah": 200,
      "retailPrice": 40665.00,
      "salesTax": 7320.00,
      "maxRetailPrice": 47985.00
    },
    "HT 300": {
      "name": "HT 300",
      "plate": 33,
      "ah": 215,
      "retailPrice": 42535.00,
      "salesTax": 7656.00,
      "maxRetailPrice": 50191.00
    },
    "HT Solar 50": {
      "name": "HT Solar 50",
      "plate": 5,
      "ah": 20,
      "retailPrice": 4830.00,
      "salesTax": 869.00,
      "maxRetailPrice": 5699.00
    },
    "HT Solar 50 PLUS": {
      "name": "HT Solar 50 PLUS",
      "plate": 5,
      "ah": 22,
      "retailPrice": 5085.00,
      "salesTax": 915.00,
      "maxRetailPrice": 6000.00
    },
    "HT SOLAR 100": {
      "name": "HT SOLAR 100",
      "plate": 9,
      "ah": 55,
      "retailPrice": 11640.00,
      "salesTax": 2095.00,
      "maxRetailPrice": 13735.00
    },
    "HT 6LT 200": {
      "name": "HT 6LT 200",
      "plate": 25,
      "ah": 130,
      "retailPrice": 26315.00,
      "salesTax": 4737.00,
      "maxRetailPrice": 31052.00
    },
    "HT 6LT 220": {
      "name": "HT 6LT 220",
      "plate": 29,
      "ah": 145,
      "retailPrice": 30265.00,
      "salesTax": 5448.00,
      "maxRetailPrice": 35713.00
    },
    "HT IPS 1200": {
      "name": "HT IPS 1200",
      "plate": 19,
      "ah": 120,
      "retailPrice": 27350.00,
      "salesTax": 4923.00,
      "maxRetailPrice": 32273.00
    },
    "HT IPS 1400": {
      "name": "HT IPS 1400",
      "plate": 21,
      "ah": 130,
      "retailPrice": 29850.00,
      "salesTax": 5373.00,
      "maxRetailPrice": 35223.00
    },
    "HT IPS 1600": {
      "name": "HT IPS 1600",
      "plate": 23,
      "ah": 160,
      "retailPrice": 32650.00,
      "salesTax": 5877.00,
      "maxRetailPrice": 38527.00
    },
    "HT IPS 2000": {
      "name": "HT IPS 2000",
      "plate": 25,
      "ah": 175,
      "retailPrice": 35250.00,
      "salesTax": 6345.00,
      "maxRetailPrice": 41595.00
    },
    "MF 50 G": {
      "name": "MF 50 G",
      "plate": 5,
      "ah": 20,
      "retailPrice": 5550.00,
      "salesTax": 999.00,
      "maxRetailPrice": 6549.00
    },
    "MF 55 R/L": {
      "name": "MF 55 R/L",
      "plate": 9,
      "ah": 38,
      "retailPrice": 8300.00,
      "salesTax": 1494.00,
      "maxRetailPrice": 9794.00
    },
    "MF 65 R/L": {
      "name": "MF 65 R/L",
      "plate": 11,
      "ah": 40,
      "retailPrice": 9300.00,
      "salesTax": 1674.00,
      "maxRetailPrice": 10974.00
    },
    "MF 70 R/L (Thin/Thick Pole)": {
      "name": "MF 70 R/L (Thin/Thick Pole)",
      "plate": 11,
      "ah": 48,
      "retailPrice": 10400.00,
      "salesTax": 1872.00,
      "maxRetailPrice": 12272.00
    },
    "MF 75 R/L (Thin/Thick Pole)": {
      "name": "MF 75 R/L (Thin/Thick Pole)",
      "plate": 12,
      "ah": 50,
      "retailPrice": 10800.00,
      "salesTax": 1944.00,
      "maxRetailPrice": 12744.00
    },
    "MF 80 R/L": {
      "name": "MF 80 R/L",
      "plate": 9,
      "ah": 50,
      "retailPrice": 10700.00,
      "salesTax": 1926.00,
      "maxRetailPrice": 12626.00
    },
    "MF 55 D 23 R": {
      "name": "MF 55 D 23 R",
      "plate": 11,
      "ah": 75,
      "retailPrice": 12900.00,
      "salesTax": 2322.00,
      "maxRetailPrice": 15222.00
    },
    "MF 85 R/L": {
      "name": "MF 85 R/L",
      "plate": 11,
      "ah": 75,
      "retailPrice": 12900.00,
      "salesTax": 2322.00,
      "maxRetailPrice": 15222.00
    },
    "MF 110 R/L": {
      "name": "MF 110 R/L",
      "plate": 13,
      "ah": 80,
      "retailPrice": 15800.00,
      "salesTax": 2844.00,
      "maxRetailPrice": 18644.00
    },
    "MF 120 R/L": {
      "name": "MF 120 R/L",
      "plate": 15,
      "ah": 90,
      "retailPrice": 17700.00,
      "salesTax": 3186.00,
      "maxRetailPrice": 20886.00
    },
    "DIN 555": {
      "name": "DIN 555",
      "plate": 9,
      "ah": 45,
      "retailPrice": 10600.00,
      "salesTax": 1908.00,
      "maxRetailPrice": 12508.00
    },
    "DIN 666": {
      "name": "DIN 666",
      "plate": 11,
      "ah": 60,
      "retailPrice": 13200.00,
      "salesTax": 2376.00,
      "maxRetailPrice": 15576.00
    },
    "DIN 777": {
      "name": "DIN 777",
      "plate": 13,
      "ah": 66,
      "retailPrice": 15250.00,
      "salesTax": 2745.00,
      "maxRetailPrice": 17995.00
    },
    "DIN 888": {
      "name": "DIN 888",
      "plate": 17,
      "ah": 88,
      "retailPrice": 19000.00,
      "salesTax": 3420.00,
      "maxRetailPrice": 22420.00
    },
    "Tubular HT 1800": {
      "name": "Tubular HT 1800",
      "plate": 5,
      "ah": 185,
      "retailPrice": 35500.00,
      "salesTax": 6390.00,
      "maxRetailPrice": 41890.00
    },
    "Tubular HT 2000": {
      "name": "Tubular HT 2000",
      "plate": 6,
      "ah": 200,
      "retailPrice": 41500.00,
      "salesTax": 7470.00,
      "maxRetailPrice": 48970.00
    },
    "Tubular HT 2500": {
      "name": "Tubular HT 2500",
      "plate": 7,
      "ah": 250,
      "retailPrice": 45800.00,
      "salesTax": 8244.00,
      "maxRetailPrice": 54044.00
    },
    "Tubular HT 3500": {
      "name": "Tubular HT 3500",
      "plate": 9,
      "ah": 280,
      "retailPrice": 58500.00,
      "salesTax": 10530.00,
      "maxRetailPrice": 69030.00
    }
  }
}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Add Battery Data'
      size='large'
    >
      <div className='flex h-[80vh] flex-col'>
        <div className='flex-1 overflow-y-auto overflow-x-hidden'>
          <div className='space-y-6'>
            <div className='text-center'>
              <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100'>
                <FaUpload className='h-8 w-8 text-blue-600' />
              </div>
              <h3 className='text-lg font-medium text-gray-900'>
                Add{' '}
                {batteryType === 'battery'
                  ? 'Battery Data'
                  : 'Battery Tonic Data'}
              </h3>
              <p className='mt-2 text-sm text-gray-500'>
                Choose between manual entry or JSON import
              </p>

              {/* Battery Type Toggle */}
              <div className='mt-4 flex items-center justify-center space-x-4'>
                <span className='text-sm font-medium text-gray-700'>
                  Data Type:
                </span>
                <label className='relative inline-flex cursor-pointer items-center'>
                  <input
                    type='checkbox'
                    className='peer sr-only'
                    checked={batteryType === 'tonic'}
                    onChange={(e) =>
                      setBatteryType(e.target.checked ? 'tonic' : 'battery')
                    }
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                </label>
                <span
                  className={`text-sm font-medium ${batteryType === 'tonic' ? 'text-blue-600' : 'text-gray-500'}`}
                >
                  Battery Tonic
                </span>
                <span
                  className={`text-sm ${batteryType === 'battery' ? 'font-medium text-blue-600' : 'text-gray-500'}`}
                >
                  Battery Data
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className='border-b border-gray-200'>
              <nav className='-mb-px flex space-x-8'>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`border-b-2 px-1 py-2 text-sm font-medium ${
                    activeTab === 'manual'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <FaPlus className='mr-2 inline h-4 w-4' />
                  Manual Entry
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`border-b-2 px-1 py-2 text-sm font-medium ${
                    activeTab === 'json'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <FaCode className='mr-2 inline h-4 w-4' />
                  JSON Import
                </button>
              </nav>
            </div>

            {/* Debug Info */}
            <div className='mb-2 text-xs text-gray-500'>
              Current tab: {activeTab}
            </div>

            {activeTab === 'manual' ? (
              /* Manual Entry Tab */
              <div className='space-y-4'>
                {/* Brand Selection */}
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Select Brand *
                  </label>
                  <Dropdown
                    options={[...brands, { label: 'Other', value: 'other' }]}
                    onSelect={handleBrandSelect}
                    placeholder='Choose a brand for this data'
                    value={selectedBrand}
                    disabled={false}
                  />

                  {batteryType === 'tonic' && (
                    <p className='mt-1 text-xs text-blue-600'>
                      💡 Battery Tonic will be added as a series to the selected
                      brand. Choose any brand from the dropdown.
                    </p>
                  )}
                </div>

                {/* Sales Tax */}
                <div>
                  <Input
                    type='text'
                    label={
                      batteryType === 'tonic'
                        ? 'Sales Tax % (Not applicable for Battery Tonic)'
                        : 'Sales Tax %'
                    }
                    name='salesTax'
                    value={batteryType === 'tonic' ? '0' : salesTax}
                    onChange={handleSalesTaxChange}
                    placeholder={
                      batteryType === 'tonic'
                        ? 'Battery Tonic has no sales tax'
                        : 'Enter sales tax percentage'
                    }
                    required
                    readOnly={batteryType === 'tonic'}
                  />
                  {batteryType === 'tonic' && (
                    <p className='mt-1 text-xs text-blue-600'>
                      💡 Battery Tonic is a consumable product and does not have
                      sales tax
                    </p>
                  )}
                </div>

                {/* Battery Data Table */}
                <div>
                  <div className='mb-3 flex items-center justify-between'>
                    <label className='block text-sm font-medium text-gray-700'>
                      {batteryType === 'battery'
                        ? 'Battery Data'
                        : 'Battery Tonic Data'}{' '}
                      *
                    </label>
                    <Button
                      variant='outline'
                      text='Add Row'
                      onClick={addBatteryRow}
                      icon={<FaPlus className='h-4 w-4' />}
                    />
                  </div>

                  <div className='rounded-lg border'>
                    <table className='w-full divide-y divide-gray-200'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th className='px-2 py-2 text-left text-xs font-medium uppercase text-gray-500'>
                            {batteryType === 'tonic' ? 'Type' : 'Name'}
                          </th>
                          {batteryType === 'battery' && (
                            <>
                              <th className='px-2 py-2 text-left text-xs font-medium uppercase text-gray-500'>
                                Plate
                              </th>
                              <th className='px-2 py-2 text-left text-xs font-medium uppercase text-gray-500'>
                                AH
                              </th>
                            </>
                          )}
                          <th className='px-2 py-2 text-left text-xs font-medium uppercase text-gray-500'>
                            Retail Price
                          </th>
                          <th className='px-2 py-2 text-left text-xs font-medium uppercase text-gray-500'>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-200 bg-white'>
                        {batteryData.map((battery, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }
                          >
                            <td className='px-2 py-2'>
                              {batteryType === 'tonic' ? (
                                <div className='flex items-center rounded border bg-gray-100 px-2 py-1 text-sm text-gray-600'>
                                  Battery Tonic
                                </div>
                              ) : (
                                <input
                                  type='text'
                                  value={battery.name}
                                  onChange={(e) =>
                                    updateBatteryData(
                                      index,
                                      'name',
                                      e.target.value
                                    )
                                  }
                                  placeholder='Battery name'
                                  className='w-full rounded border border-gray-300 px-2 py-1 text-sm'
                                />
                              )}
                            </td>
                            {batteryType === 'battery' && (
                              <>
                                <td className='px-2 py-2'>
                                  <input
                                    type='text'
                                    value={battery.plate || ''}
                                    onChange={(e) =>
                                      updateBatteryData(
                                        index,
                                        'plate',
                                        e.target.value
                                      )
                                    }
                                    placeholder='Plate count'
                                    className='w-full rounded border border-gray-300 px-2 py-1 text-sm'
                                  />
                                </td>
                                <td className='px-2 py-2'>
                                  <input
                                    type='number'
                                    value={battery.ah || ''}
                                    onChange={(e) =>
                                      updateBatteryData(
                                        index,
                                        'ah',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    placeholder='AH'
                                    className='w-full rounded border border-gray-300 px-2 py-1 text-sm'
                                  />
                                </td>
                              </>
                            )}
                            <td className='px-2 py-2'>
                              <input
                                type='number'
                                value={battery.retailPrice || ''}
                                onChange={(e) =>
                                  updateBatteryData(
                                    index,
                                    'retailPrice',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                placeholder='Retail price'
                                className='w-full rounded border border-gray-300 px-2 py-1 text-sm'
                              />
                            </td>
                            <td className='px-2 py-2'>
                              {batteryData.length > 1 && (
                                <button
                                  onClick={() => removeBatteryRow(index)}
                                  className='text-red-600 hover:text-red-800'
                                  title='Remove row'
                                >
                                  <FaTrash className='h-4 w-4' />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* JSON Import Tab */
              <div className='space-y-4 rounded-lg border-2 border-green-300 bg-green-50 p-4'>
                <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                  <h4 className='mb-2 text-sm font-medium text-blue-900'>
                    JSON Format Requirements
                  </h4>
                  <p className='mb-3 text-sm text-blue-700'>
                    Paste JSON data in the following format
                    {batteryType === 'tonic'
                      ? ' for Battery Tonic (only name and retailPrice required)'
                      : ' for Batteries (all fields required)'}
                    :
                  </p>
                  <pre className='overflow-x-auto rounded bg-blue-100 p-3 text-xs text-blue-800'>
                    {`{
  "brandName": "${batteryType === 'tonic' ? 'Any Brand' : 'Brand Name'}",
  "salesTax": ${batteryType === 'tonic' ? '0' : '18'},
  "products": {
    "${batteryType === 'tonic' ? 'Battery Tonic' : 'Product Key'}": {
      ${
        batteryType === 'tonic'
          ? `"name": "Battery Tonic",
      "retailPrice": 150.00`
          : `"name": "Product Name",
      "plate": 7,
      "ah": 24,
      "retailPrice": 6150.00,
      "salesTax": 1107.00`
      }
    }
  }
}`}
                  </pre>
                  {batteryType === 'tonic' && (
                    <p className='mt-2 text-xs text-blue-600'>
                      💡 Battery Tonic will be added as a series to the selected
                      brand. Choose any brand or select &quot;Other&quot; for a
                      new brand.
                    </p>
                  )}
                </div>

                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Paste JSON Data *
                  </label>
                  <textarea
                    value={jsonData}
                    onChange={(e) => setJsonData(e.target.value)}
                    placeholder='Paste your JSON data here...'
                    className='h-64 w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none'
                    rows={12}
                  />
                </div>

                <div className='flex flex-wrap gap-2'>
                  <Button
                    variant='outline'
                    text='Load Sample'
                    onClick={() => {
                      setConfirmAction({ type: 'loadSample' });
                      setShowConfirmModal(true);
                    }}
                  />
                  <Button
                    variant='outline'
                    text='Load Full Osaka'
                    onClick={() => {
                      setConfirmAction({ type: 'loadFull' });
                      setShowConfirmModal(true);
                    }}
                  />
                  <Button
                    variant='outline'
                    text='Validate JSON'
                    onClick={() => {
                      try {
                        if (jsonData.trim()) {
                          const trimmed = jsonData.trim();
                          JSON.parse(trimmed);
                          toast.success('JSON is valid!');
                        } else {
                          toast.error('Please paste JSON data first');
                        }
                      } catch (error) {
                        toast.error(
                          `JSON validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                        );
                      }
                    }}
                  />
                  <Button
                    variant='outline'
                    text='Fix JSON'
                    onClick={() => {
                      if (jsonData.trim()) {
                        try {
                          const fixed = fixJsonSyntax(jsonData);
                          setJsonData(fixed);

                          // Test if the fixed JSON is valid
                          try {
                            JSON.parse(fixed);
                            toast.success(
                              'JSON syntax has been fixed and is now valid!'
                            );
                          } catch (parseError) {
                            toast.warning(
                              'JSON was partially fixed, but may still have issues. Please check manually.'
                            );
                          }
                        } catch (error) {
                          toast.error('Failed to fix JSON syntax');
                        }
                      } else {
                        toast.error('Please paste JSON data first');
                      }
                    }}
                  />
                  <Button
                    variant='outline'
                    text='Show Fixed'
                    onClick={handleShowFixedJson}
                  />
                  <Button
                    variant='outline'
                    text='Clear'
                    onClick={() => {
                      setConfirmAction({ type: 'clear' });
                      setShowConfirmModal(true);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className='flex-shrink-0 border-t bg-white pt-4'>
          <div className='flex justify-end space-x-3'>
            <Button variant='outline' text='Cancel' onClick={handleClose} />
            <Button
              variant='fill'
              text={activeTab === 'manual' ? 'Save Data' : 'Import JSON'}
              onClick={
                activeTab === 'manual'
                  ? handleManualSave
                  : () => {
                      setConfirmAction({ type: 'import' });
                      setShowConfirmModal(true);
                    }
              }
              icon={<FaSave className='h-4 w-4' />}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        title='Confirm Action'
        size='small'
      >
        <div className='space-y-4'>
          <div className='text-center'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
              <svg
                className='h-6 w-6 text-blue-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <h3 className='mb-2 text-lg font-medium text-gray-900'>
              {confirmAction?.type === 'import' && 'Import JSON Data'}
              {confirmAction?.type === 'clear' && 'Clear JSON Data'}
              {confirmAction?.type === 'loadSample' && 'Load Sample Data'}
              {confirmAction?.type === 'loadFull' && 'Load Full Osaka Data'}
            </h3>
            <p className='text-sm text-gray-500'>
              {confirmAction?.type === 'import' &&
                'Are you sure you want to import this JSON data? This will create or update the category with the provided data.'}
              {confirmAction?.type === 'clear' &&
                'Are you sure you want to clear all JSON data? This action cannot be undone.'}
              {confirmAction?.type === 'loadSample' &&
                'Are you sure you want to load the sample JSON data? This will replace any existing data.'}
              {confirmAction?.type === 'loadFull' &&
                'Are you sure you want to load the full Osaka batteries data? This will replace any existing data.'}
            </p>
          </div>

          <div className='flex flex-col gap-3 pt-4'>
            <Button
              className='h-12 w-full text-base font-medium focus:outline-none focus:ring-0'
              variant='fill'
              text={
                confirmAction?.type === 'import'
                  ? 'Import JSON'
                  : confirmAction?.type === 'clear'
                    ? 'Clear Data'
                    : confirmAction?.type === 'loadSample'
                      ? 'Load Sample'
                      : 'Load Full Data'
              }
              onClick={handleConfirmAction}
            />
            <Button
              className='h-12 w-full text-base focus:outline-none focus:ring-0'
              variant='outline'
              text='Cancel'
              type='button'
              onClick={() => {
                setShowConfirmModal(false);
                setConfirmAction(null);
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Update Category Modal */}
      <Modal
        isOpen={showUpdateCategoryModal}
        onClose={() => {
          setShowUpdateCategoryModal(false);
          setUpdateCategoryData(null);
        }}
        title='Update Category'
        size='small'
      >
        <div className='space-y-4'>
          <div className='text-center'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
              <svg
                className='h-6 w-6 text-yellow-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <h3 className='mb-2 text-lg font-medium text-gray-900'>
              {updateCategoryData?.brandName === 'JSON Fix'
                ? 'JSON Syntax Fixed'
                : 'Update Existing Category'}
            </h3>
            <p className='text-sm text-gray-500'>
              {updateCategoryData?.brandName === 'JSON Fix'
                ? 'JSON had syntax errors. I fixed them automatically. Would you like to use the fixed version?'
                : `Category for "${updateCategoryData?.brandName}" already exists with ${updateCategoryData?.seriesCount} series. Do you want to update it?`}
            </p>
          </div>

          <div className='flex flex-col gap-3 pt-4'>
            <Button
              className='h-12 w-full text-base font-medium focus:outline-none focus:ring-0'
              variant='fill'
              text={
                updateCategoryData?.brandName === 'JSON Fix'
                  ? 'Use Fixed JSON'
                  : 'Update Category'
              }
              onClick={handleUpdateCategoryConfirm}
            />
            <Button
              className='h-12 w-full text-base focus:outline-none focus:ring-0'
              variant='outline'
              text='Cancel'
              type='button'
              onClick={() => {
                setShowUpdateCategoryModal(false);
                setUpdateCategoryData(null);
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Fixed JSON Modal */}
      <Modal
        isOpen={showFixedJsonModal}
        onClose={() => {
          setShowFixedJsonModal(false);
          setFixedJsonData('');
        }}
        title='Fixed JSON Data'
        size='large'
      >
        <div className='space-y-4'>
          <div className='rounded-lg border bg-gray-50 p-4'>
            <div className='mb-2 flex items-center justify-between'>
              <h4 className='text-sm font-medium text-gray-700'>
                Fixed JSON Syntax
              </h4>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fixedJsonData);
                  toast.success('JSON copied to clipboard!');
                }}
                className='text-sm font-medium text-blue-600 hover:text-blue-800'
              >
                Copy to Clipboard
              </button>
            </div>
            <pre className='max-h-96 overflow-x-auto overflow-y-auto rounded border bg-white p-3 text-xs text-gray-800'>
              {fixedJsonData}
            </pre>
          </div>

          <div className='flex justify-end'>
            <Button
              variant='outline'
              text='Close'
              onClick={() => {
                setShowFixedJsonModal(false);
                setFixedJsonData('');
              }}
            />
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default PdfUploadModal;
