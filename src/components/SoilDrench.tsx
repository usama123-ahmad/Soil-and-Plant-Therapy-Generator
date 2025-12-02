import React, { useState } from 'react';
import ReportSection from './ReportSection';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Droplets, X, ExternalLink } from 'lucide-react';
import { soilDrenchProducts as products } from '../fertilizerProducts';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';

interface SelectedProduct {
  id: string;
  product: string;
  rate: string;
  unit: string;
  nutrientContent?: Record<string, number>;
}

interface SoilDrenchProps {
  selectedProducts: SelectedProduct[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<SelectedProduct[]>>;
  deficientNutrients?: string[];
  title?: string;
  description?: string;
  placeholder?: string;
}

const SoilDrench: React.FC<SoilDrenchProps> = ({ 
  selectedProducts, 
  setSelectedProducts, 
  deficientNutrients,
  title = "Biological Fertigation Program",
  description = "Biological fertigation programs deliver nutrients and beneficial compounds directly to the root zone, improving nutrient uptake and soil biology activation.",
  placeholder = "Choose biological fertigation"
}) => {
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentRate, setCurrentRate] = useState('');
  const [currentUnit, setCurrentUnit] = useState('');
  const [search, setSearch] = useState('');
  const filteredProducts = products.filter(product =>
    product.label.toLowerCase().includes(search.toLowerCase())
  );

  const units = ['g/ha', 'ml/ha', 'kg/ha', 'L/ha', 'mL/100L Water', 'L/100L Water', 'g/100L Water', 'kg/100L Water'];

  // Always show all products, regardless of deficiencies
  // const filteredProducts = products; // This line is removed as per the new_code

  const addProduct = () => {
    if (currentProduct && currentRate && currentUnit) {
      const productData = products.find(p => p.value === currentProduct);
      if (productData) {
        const newProduct: SelectedProduct = {
          id: Date.now().toString(),
          product: productData.label,
          rate: currentRate,
          unit: currentUnit,
          nutrientContent: productData.nutrientContent || {}
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
    <ReportSection title={title}>
      <Card className="bg-white">
        <CardContent>
          <div className="space-y-4 mt-6">
            <p className="text-gray-700 mb-4">
              {description}
            </p>
            
            <Card className="bg-white">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label>Select Product</Label>
                    <Select value={currentProduct} onValueChange={handleProductChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <input
                          type="text"
                          placeholder="Search product..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="w-full px-2 py-1 mb-2 border rounded text-sm"
                        />
                        {filteredProducts.map((product) => {
                          const nutrients = Object.entries(product.nutrientContent || {})
                            .filter(([_, v]) => typeof v === 'number' && v > 0)
                            .map(([k, v]) => `${k}: ${v}%`).join(', ');
                          return (
                            <SelectItem key={product.value} value={product.value}>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center">
                                  <span className="font-semibold block text-base break-words text-black" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>{product.label}</span>
                                  <a
                                    href={`https://www.nutri-tech.com.au/products/${product.value}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-600 hover:underline"
                                    onClick={e => e.stopPropagation()}
                                    title="View product page"
                                  >
                                    <ExternalLink className="w-4 h-4 inline" />
                                  </a>
                                </div>
                                <span
                                  className="text-xs text-gray-500 block mt-1 break-words"
                                  style={{ wordBreak: 'break-word', whiteSpace: 'normal', maxWidth: '260px' }}
                                >
                                  {nutrients || '(No nutrients)'}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Application Rate</Label>
                    <Input
                      type="number"
                      value={currentRate}
                      onChange={(e) => setCurrentRate(e.target.value)}
                      placeholder="Enter rate"
                    />
                  </div>

                  <div>
                    <Label>Unit</Label>
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
                  return (
                    <Card key={product.id} className="bg-blue-100 border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <Droplets className="h-5 w-5 text-blue-600" />
                            <div className="flex-1">
                              <h5 className="font-medium text-black">
                                {product.product}
                              </h5>
                              {productData && (
                                <p className="text-xs text-gray-500">
                                  {Object.entries(productData.nutrientContent || {})
                                    .filter(([_, v]) => typeof v === 'number' && v > 0)
                                    .map(([k, v]) => `${k}: ${v}%`).join(', ') || '(No nutrients)'}
                                </p>
                              )}
                              <p className="text-sm text-blue-700">Rate: {product.rate} {product.unit}</p>
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

export default SoilDrench;