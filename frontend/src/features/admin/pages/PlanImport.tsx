import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import { API_URL } from '../../../lib/constants';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedLot {
  block: string | null;
  lot_number: string | null;
  area_m2: number | null;
  confidence: number;
  status: 'NEW' | 'EXISTS' | 'UNCERTAIN' | 'INVALID';
  bbox: BoundingBox | null;
  raw_text: string;
  notes: string;
  validation_issues: string[];
}

interface AnalysisResult {
  project_id: number;
  filename: string;
  file_url: string | null;
  total_detected: number;
  new_lots: number;
  existing_lots: number;
  uncertain_lots: number;
  invalid_lots: number;
  lots: DetectedLot[];
  processing_time_seconds: number;
}

interface EditableLot extends DetectedLot {
  selected: boolean;
  edited: boolean;
}

interface ImportResponse {
  project_id: number;
  total_imported: number;
  total_skipped: number;
  total_errors: number;
  imported_lot_ids: number[];
  skipped_lots: Array<{ block: string; lot_number: string; reason: string }>;
  errors: Array<{ block: string; lot_number: string; error: string }>;
}

export default function PlanImport() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [lots, setLots] = useState<EditableLot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Validar extensión
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se permiten archivos PDF');
      return;
    }
    
    // Validar tamaño (30 MB por defecto)
    const maxSize = 30 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('El archivo excede el tamaño máximo de 30 MB');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setAnalysisResult(null);
    setLots([]);
  };
  
  const handleAnalyze = async () => {
    if (!file || !projectId) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Llamada directa con fetch porque necesitamos enviar FormData
      const token = localStorage.getItem('netland_token');
      const response = await fetch(
        `${API_URL}/projects/${projectId}/lots/plan/analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData // No establecer Content-Type, el browser lo hace automáticamente con boundary
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error al analizar el plano' }));
        throw new Error(errorData.detail || 'Error al analizar el plano');
      }
      
      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);
      
      // Preparar lotes editables
      const editableLots: EditableLot[] = result.lots.map(lot => ({
        ...lot,
        selected: lot.status === 'NEW', // Auto-seleccionar solo nuevos
        edited: false
      }));
      
      setLots(editableLots);
      
    } catch (err: any) {
      console.error('Error analizando plano:', err);
      setError(
        err.message || 
        'Error al analizar el plano. Verifica que el archivo sea válido.'
      );
    } finally {
      setAnalyzing(false);
    }
  };
  
  const handleImport = async () => {
    if (!analysisResult || !projectId) return;
    
    const selectedLots = lots.filter(lot => lot.selected && lot.status !== 'EXISTS');
    
    if (selectedLots.length === 0) {
      setError('Debes seleccionar al menos un lote para importar');
      return;
    }
    
    // Validar que todos tengan manzana y número
    const invalid = selectedLots.filter(lot => !lot.block || !lot.lot_number);
    if (invalid.length > 0) {
      setError('Algunos lotes seleccionados no tienen manzana o número de lote');
      return;
    }
    
    setImporting(true);
    setError(null);
    
    try {
      const payload = {
        project_id: parseInt(projectId),
        lots: selectedLots.map(lot => ({
          block: lot.block!,
          lot_number: lot.lot_number!,
          area_m2: lot.area_m2,
          notes: lot.notes
        }))
      };
      
      const result = await api.post<ImportResponse>(
        `/projects/${projectId}/lots/plan/import`,
        payload,
        true // authenticated = true
      );
      
      if (result.total_imported > 0) {
        alert(
          `✓ Importación completada:\n\n` +
          `• ${result.total_imported} lotes importados\n` +
          `• ${result.total_skipped} lotes omitidos (ya existen)\n` +
          `• ${result.total_errors} errores`
        );
        
        // Volver a la lista de lotes
        navigate(`/admin/lotes`);
      } else {
        setError('No se pudo importar ningún lote');
      }
      
    } catch (err: any) {
      console.error('Error importando lotes:', err);
      setError(
        err.message || 
        'Error al importar lotes'
      );
    } finally {
      setImporting(false);
    }
  };
  
  const handleToggleSelect = (index: number) => {
    setLots(prev => prev.map((lot, i) => 
      i === index ? { ...lot, selected: !lot.selected } : lot
    ));
  };
  
  const handleToggleSelectAll = () => {
    const filteredLots = getFilteredLots();
    const allSelected = filteredLots.every(lot => lot.selected);
    
    setLots(prev => prev.map(lot => {
      if (filteredLots.includes(lot) && lot.status !== 'EXISTS') {
        return { ...lot, selected: !allSelected };
      }
      return lot;
    }));
  };
  
  const handleEditLot = (index: number, field: string, value: any) => {
    setLots(prev => prev.map((lot, i) => 
      i === index ? { ...lot, [field]: value, edited: true } : lot
    ));
  };
  
  const getFilteredLots = () => {
    if (filterStatus === 'all') return lots;
    return lots.filter(lot => lot.status === filterStatus);
  };
  
  const getStatusBadge = (status: string) => {
    const styles = {
      NEW: 'bg-green-100 text-green-800',
      EXISTS: 'bg-gray-100 text-gray-800',
      UNCERTAIN: 'bg-yellow-100 text-yellow-800',
      INVALID: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      NEW: 'Nuevo',
      EXISTS: 'Existe',
      UNCERTAIN: 'Revisar',
      INVALID: 'Inválido'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };
  
  const filteredLots = getFilteredLots();
  const selectedCount = lots.filter(l => l.selected).length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importar Lotes desde Plano</h1>
          <p className="mt-1 text-sm text-gray-600">
            Sube el PDF del plano para detectar automáticamente los lotes
          </p>
        </div>
        <button
          onClick={() => navigate(`/admin/projects/${projectId}/lots`)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Volver a Lotes
        </button>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg p-1.5 hover:bg-red-100"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Upload Section */}
      {!analysisResult && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">1. Seleccionar Plano PDF</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo PDF del Plano
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                disabled={analyzing}
              />
              <p className="mt-1 text-xs text-gray-500">
                Tamaño máximo: 30 MB. Solo archivos PDF.
              </p>
            </div>
            
            {file && (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {analyzing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analizando...
                    </>
                  ) : (
                    '🔍 Analizar Plano'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Analysis Results */}
      {analysisResult && (
        <>
          {/* Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">2. Resultado del Análisis</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{analysisResult.total_detected}</div>
                <div className="text-xs text-gray-600">Detectados</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{analysisResult.new_lots}</div>
                <div className="text-xs text-green-600">Nuevos</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{analysisResult.existing_lots}</div>
                <div className="text-xs text-gray-600">Ya Existen</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{analysisResult.uncertain_lots}</div>
                <div className="text-xs text-yellow-600">Revisar</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{analysisResult.invalid_lots}</div>
                <div className="text-xs text-red-600">Inválidos</div>
              </div>
            </div>
            
            <p className="mt-4 text-sm text-gray-600">
              Tiempo de procesamiento: {analysisResult.processing_time_seconds.toFixed(1)}s
            </p>
          </div>
          
          {/* Lots Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">3. Revisar y Confirmar Lotes</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedCount} lotes seleccionados para importar
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos ({lots.length})</option>
                    <option value="NEW">Nuevos ({analysisResult.new_lots})</option>
                    <option value="EXISTS">Existentes ({analysisResult.existing_lots})</option>
                    <option value="UNCERTAIN">Revisar ({analysisResult.uncertain_lots})</option>
                    <option value="INVALID">Inválidos ({analysisResult.invalid_lots})</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={filteredLots.length > 0 && filteredLots.filter(l => l.status !== 'EXISTS').every(l => l.selected)}
                        onChange={handleToggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manzana</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área (m²)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confianza</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLots.map((lot) => {
                    const originalIndex = lots.indexOf(lot);
                    return (
                      <tr key={originalIndex} className={lot.edited ? 'bg-blue-50' : ''}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={lot.selected}
                            onChange={() => handleToggleSelect(originalIndex)}
                            disabled={lot.status === 'EXISTS'}
                            className="rounded border-gray-300 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={lot.block || ''}
                            onChange={(e) => handleEditLot(originalIndex, 'block', e.target.value)}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                            maxLength={5}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={lot.lot_number || ''}
                            onChange={(e) => handleEditLot(originalIndex, 'lot_number', e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                            maxLength={10}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={lot.area_m2 || ''}
                            onChange={(e) => handleEditLot(originalIndex, 'area_m2', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                            step="0.01"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  lot.confidence >= 0.8 ? 'bg-green-600' :
                                  lot.confidence >= 0.6 ? 'bg-yellow-600' :
                                  'bg-red-600'
                                }`}
                                style={{ width: `${lot.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{(lot.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(lot.status)}
                        </td>
                        <td className="px-4 py-3">
                          {lot.validation_issues.length > 0 && (
                            <div className="text-xs text-gray-600">
                              {lot.validation_issues.map((issue, i) => (
                                <div key={i}>• {issue}</div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setLots([]);
                  setFile(null);
                }}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Analizar Otro Plano
              </button>
              
              <button
                onClick={handleImport}
                disabled={importing || selectedCount === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Importando...
                  </>
                ) : (
                  `✓ Confirmar Importación (${selectedCount})`
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
