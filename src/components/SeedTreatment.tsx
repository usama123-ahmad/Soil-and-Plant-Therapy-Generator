import React, { useState } from 'react';
import ReportSection from './ReportSection';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sprout, X } from 'lucide-react';
import { PRODUCT_INFO, normalizeProductName } from './ClientReportExport';

interface SelectedProduct {
  id: string;
  product: string;
  rate: string;
  unit: string;
}

interface SeedTreatmentProps {
  selectedProducts: SelectedProduct[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<SelectedProduct[]>>;
  productOptions?: any[]; // Add this prop
}

const SeedTreatment: React.FC<SeedTreatmentProps> = ({ selectedProducts, setSelectedProducts, productOptions }) => {
  const products = productOptions || require('../fertilizerProducts').foliarSprayProducts;
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentRate, setCurrentRate] = useState('');
  const [currentUnit, setCurrentUnit] = useState('');
  const [search, setSearch] = useState('');

  const units = ['g/ha', 'ml/ha', 'kg/ha', 'L/ha', 'L/tonne of seed', 'kg/tonne of seed', 'mL/100L Water', 'L/100L Water', 'g/100L Water', 'kg/100L Water'];

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.label.toLowerCase().includes(search.toLowerCase())
  );

  const addProduct = () => {
    if (currentProduct && currentRate && currentUnit) {
      const productData = products.find(p => p.value === currentProduct);
      if (productData) {
        const newProduct: SelectedProduct = {
          id: Date.now().toString(),
          product: productData.label,
          rate: currentRate,
          unit: currentUnit
        };
        setSelectedProducts([...selectedProducts, newProduct]);
        setCurrentProduct('');
        setCurrentRate('');
        setCurrentUnit('');
      }
    }
  };

  const removeProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  const handleProductChange = (value: string) => {
    setCurrentProduct(value);
    const productData = products.find(p => p.value === value);
    if (productData) {
      setCurrentRate(productData.defaultRate);
      setCurrentUnit(productData.defaultUnit);
    }
  };

  return (
    <ReportSection title="Seed Treatment">
      <Card className="bg-white">
        <CardContent>
          <div className="space-y-4 mt-6">
            <p className="text-gray-700 mb-4">
              Seed treatments enhance germination rates, protect against soil-borne diseases, and establish beneficial microbial relationships. Apply treatments according to seed weight and planting conditions for optimal establishment.
            </p>
            
            <Card className="bg-white">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label htmlFor="product">Select Product</Label>
                    <Select value={currentProduct} onValueChange={handleProductChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose seed treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        <input
                          type="text"
                          placeholder="Search product..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="w-full px-2 py-1 mb-2 border rounded text-sm"
                        />
                        {filteredProducts.map((product) => (
                          <SelectItem key={product.value} value={product.value}>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-black">{product.label}</span>
                                <a href={`https://www.nutri-tech.com.au/products/${product.value}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600" style={{fontSize: '14px'}}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m3-3h6m0 0v6m0-6L10 14"/></svg>
                                </a>
                              </div>
                              {product.nutrientPercents && product.nutrientPercents.length > 0 && (
                                <div className="text-xs text-gray-500 mt-0.5">{product.nutrientPercents.join(', ')}</div>
                              )}
                              {product.nutrientBreakdown && (
                                <div className="text-xs text-gray-400 mt-0.5">{product.nutrientBreakdown}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="rate">Application Rate</Label>
                    <Input
                      id="rate"
                      type="text"
                      value={currentRate}
                      onChange={(e) => setCurrentRate(e.target.value)}
                      placeholder="Enter rate"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={currentUnit} onValueChange={setCurrentUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={addProduct} 
                      disabled={!currentProduct || !currentRate || !currentUnit}
                      className="bg-[#8cb43a] hover:bg-[#7ca32e] text-white w-full"
                    >
                      Add Product
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedProducts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-black">Selected Products:</h4>
                {selectedProducts.map((product) => {
                  const productData = products.find(p => p.label === product.product);
                  // Use PRODUCT_INFO with normalization if available
                  const normalized = normalizeProductName(product.product);
                  const info = PRODUCT_INFO[normalized];
                  const description = info?.description || productData?.description;
                  return (
                    <Card key={product.id} className="bg-purple-100 border-l-4 border-l-purple-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-black">
                                {product.product}
                                {productData && productData.contains && (
                                  <span className="text-xs text-gray-500 ml-2">({productData.contains.join(', ')})</span>
                                )}
                              </h5>
                              <p className="text-sm text-purple-700">Rate: {product.rate} {product.unit}</p>
                              {description && (
                                <p className="text-xs text-gray-700 mt-1">{description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(product.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ReportSection>
  );
};

export const PlantingBlend: React.FC<SeedTreatmentProps> = ({ selectedProducts, setSelectedProducts, productOptions }) => {
  const products = productOptions || require('../fertilizerProducts').foliarSprayProducts;
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentRate, setCurrentRate] = useState('');
  const [currentUnit, setCurrentUnit] = useState('');
  const [search, setSearch] = useState('');

  const units = ['g/ha', 'ml/ha', 'kg/ha', 'L/ha', 'L/tonne of seed', 'kg/tonne of seed', 'mL/100L Water', 'L/100L Water', 'g/100L Water', 'kg/100L Water'];

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.label.toLowerCase().includes(search.toLowerCase())
  );

  const addProduct = () => {
    if (currentProduct && currentRate && currentUnit) {
      const productData = products.find(p => p.value === currentProduct);
      if (productData) {
        const newProduct: SelectedProduct = {
          id: Date.now().toString(),
          product: productData.label,
          rate: currentRate,
          unit: currentUnit
        };
        setSelectedProducts([...selectedProducts, newProduct]);
        setCurrentProduct('');
        setCurrentRate('');
        setCurrentUnit('');
      }
    }
  };

  const removeProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  const handleProductChange = (value: string) => {
    setCurrentProduct(value);
    const productData = products.find(p => p.value === value);
    if (productData) {
      setCurrentRate(productData.defaultRate);
      setCurrentUnit(productData.defaultUnit);
    }
  };

  return (
    <ReportSection title="Planting Blend">
      <Card className="bg-white">
        <CardContent>
          <div className="space-y-4 mt-6">
            <p className="text-gray-700 mb-4">
              Planting blends provide a balanced mix of nutrients and biologicals at sowing, supporting early root development and crop establishment. Apply blends according to crop and soil needs for best results.
            </p>
            <Card className="bg-white">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label htmlFor="product">Select Product</Label>
                    <Select value={currentProduct} onValueChange={handleProductChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose planting blend" />
                      </SelectTrigger>
                      <SelectContent>
                        <input
                          type="text"
                          placeholder="Search product..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="w-full px-2 py-1 mb-2 border rounded text-sm"
                        />
                        {filteredProducts.map((product) => (
                          <SelectItem key={product.value} value={product.value}>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-black">{product.label}</span>
                                <a href={`https://www.nutri-tech.com.au/products/${product.value}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-orange-600" style={{fontSize: '14px'}}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m3-3h6m0 0v6m0-6L10 14"/></svg>
                                </a>
                              </div>
                              {product.nutrientPercents && product.nutrientPercents.length > 0 && (
                                <div className="text-xs text-gray-500 mt-0.5">{product.nutrientPercents.join(', ')}</div>
                              )}
                              {product.nutrientBreakdown && (
                                <div className="text-xs text-gray-400 mt-0.5">{product.nutrientBreakdown}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rate">Application Rate</Label>
                    <Input
                      id="rate"
                      type="text"
                      value={currentRate}
                      onChange={(e) => setCurrentRate(e.target.value)}
                      placeholder="Enter rate"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={currentUnit} onValueChange={setCurrentUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={addProduct} 
                      disabled={!currentProduct || !currentRate || !currentUnit}
                      className="bg-[#8cb43a] hover:bg-[#7ca32e] text-white w-full"
                    >
                      Add Product
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {selectedProducts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-black">Selected Products:</h4>
                {selectedProducts.map((product) => {
                  const productData = products.find(p => p.label === product.product);
                  // Use PRODUCT_INFO with normalization if available
                  const normalized = normalizeProductName(product.product);
                  const info = PRODUCT_INFO[normalized];
                  const description = info?.description || productData?.description;
                  return (
                    <Card key={product.id} className="bg-purple-100 border-l-4 border-l-purple-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-black">
                                {product.product}
                                {productData && productData.contains && (
                                  <span className="text-xs text-gray-500 ml-2">({productData.contains.join(', ')})</span>
                                )}
                              </h5>
                              <p className="text-sm text-purple-700">Rate: {product.rate} {product.unit}</p>
                              {description && (
                                <p className="text-xs text-gray-700 mt-1">{description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(product.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ReportSection>
  );
};

export default SeedTreatment;