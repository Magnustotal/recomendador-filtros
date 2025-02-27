'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import tips from '../data/tips';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function Home() {
  const [dimensionsMode, setDimensionsMode] = useState(null);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [volume, setVolume] = useState('');
  const [calculatedVolume, setCalculatedVolume] = useState(0);
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendedFilters, setRecommendedFilters] = useState([]);
  const [adequateFilters, setAdequateFilters] = useState([]);
  const [notAdequateFilters, setNotAdequateFilters] = useState([]);
  const [recommendedCombinations, setRecommendedCombinations] = useState([]);
  const [adequateCombinations, setAdequateCombinations] = useState([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: 'caudal', direction: 'ascending' });

  useEffect(() => {
    const fetchFilters = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.from('filtros').select('*');
        if (error) throw error;
        setFilters(data || []);
      } catch (err) {
        setError(err.message || 'Error al cargar los filtros');
      } finally {
        setLoading(false);
      }
    };
    fetchFilters();
  }, []);

  const classifyFilters = (aquariumVolume, filtersData) => {
    if (!aquariumVolume || filtersData.length === 0) {
      return { recommended: [], adequate: [], notAdequate: [], recommendedCombinations: [], adequateCombinations: [] };
    }

    const recommended = [];
    const adequate = [];
    const notAdequate = [];
    const recommendedCombinations = [];
    const adequateCombinations = [];
    const minFlowRate = aquariumVolume * 10;
    const maxCaudal = Math.max(...filtersData.map((filter) => filter.caudal));
    const combinationThreshold = maxCaudal / 10;

    // Clasificar filtros individuales
    filtersData.forEach((filter) => {
      const caudal = filter.caudal;
      const vol_filtrante = filter.volumen_vaso_filtro;

      if (caudal < minFlowRate) {
        notAdequate.push(filter);
        return;
      }

      const filteringVolume = vol_filtrante;

      if (caudal >= minFlowRate && filteringVolume >= aquariumVolume * 0.05) {
        recommended.push(filter);
        return;
      } else if (caudal >= minFlowRate && filteringVolume >= aquariumVolume * 0.025) {
        adequate.push(filter);
        return;
      } else {
        notAdequate.push(filter);
      }
    });

    // Combinaciones para acuarios grandes
    if (aquariumVolume > combinationThreshold) {
      filtersData.forEach((filter1, index) => {
        filtersData.slice(index + 1).forEach((filter2) => {
          if (filter1.modelo === filter2.modelo) {
            const combinedCaudal = filter1.caudal + filter2.caudal;
            const combinedVolFiltrante = filter1.volumen_vaso_filtro + filter2.volumen_vaso_filtro;

            if (combinedCaudal >= minFlowRate && combinedVolFiltrante >= aquariumVolume * 0.05) {
              recommendedCombinations.push({
                id: `${filter1.id}-${filter2.id}-recommended`,
                marca: filter1.marca,
                modelo: `${filter1.modelo} x2`,
                caudal: combinedCaudal,
                volumen_vaso_filtro: combinedVolFiltrante,
              });
            } else if (combinedCaudal >= minFlowRate && combinedVolFiltrante >= aquariumVolume * 0.025) {
              adequateCombinations.push({
                id: `${filter1.id}-${filter2.id}-adequate`,
                marca: filter1.marca,
                modelo: `${filter1.modelo} x2`,
                caudal: combinedCaudal,
                volumen_vaso_filtro: combinedVolFiltrante,
              });
            }
          }
        });
      });
    }

    return { recommended, adequate, notAdequate, recommendedCombinations, adequateCombinations };
  };

  const handleDimensionChange = (l, w, h) => {
    if (l && w && h) {
      const vol = (l * w * h) / 1000;
      setCalculatedVolume(vol);
      setVolume(vol);
    } else {
      setCalculatedVolume(0);
      setVolume('');
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    setCalculatedVolume(newVolume);
  };

  const resetForm = () => {
    setDimensionsMode(null);
    setLength('');
    setWidth('');
    setHeight('');
    setVolume('');
    setCalculatedVolume(0);
    setRecommendedFilters([]);
    setAdequateFilters([]);
    setNotAdequateFilters([]);
    setRecommendedCombinations([]);
    setAdequateCombinations([]);
  };

  const nextTip = () => {
    setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
  };

  const prevTip = () => {
    setCurrentTipIndex((prevIndex) => (prevIndex - 1 + tips.length) % tips.length);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedFilters = useMemo(() => {
    let sortableFilters = [...recommendedFilters, ...adequateFilters, ...recommendedCombinations, ...adequateCombinations];
    if (sortConfig !== null) {
      sortableFilters.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableFilters;
  }, [recommendedFilters, adequateFilters, recommendedCombinations, adequateCombinations, sortConfig]);

  return (
    <div className="container mx-auto p-4 dark:bg-gray-900 dark:text-white">
      <h1 className="text-3xl font-bold text-center mb-4">Recomendador de Filtros</h1>
      <p className="text-center text-lg mb-8">
        Encuentra el filtro perfecto para tu acuario de agua dulce. 🌊🌿
      </p>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md mb-8 dark:bg-yellow-800 dark:border-yellow-300 dark:text-yellow-100" role="alert">
        <p className="font-bold">Consejo:</p>
        <p>{tips[currentTipIndex]}</p>
        <div className="mt-2">
          <button onClick={prevTip} className="mr-2 px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700">
            &lt;
          </button>
          <button onClick={nextTip} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700">
            &gt;
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800 dark:text-white">
        {!dimensionsMode && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center dark:text-gray-300">
              ¿Qué datos vamos a usar? 🤔
            </label>
            <div className="mt-1 flex rounded-md shadow-sm justify-center">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-l-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  dimensionsMode === true ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setDimensionsMode(true)}
              >
                Dimensiones 📏
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  dimensionsMode === false ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setDimensionsMode(false)}
              >
                Volumen 💧
              </button>
            </div>
          </div>
        )}
        {dimensionsMode === true && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Dimensiones del Acuario (cm)
            </label>
            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Largo"
                value={length}
                onChange={(e) => {
                  setLength(e.target.value);
                  handleDimensionChange(e.target.value, width, height);
                }}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <input
                type="number"
                placeholder="Ancho"
                value={width}
                onChange={(e) => {
                  setWidth(e.target.value);
                  handleDimensionChange(length, e.target.value, height);
                }}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <input
                type="number"
                placeholder="Alto"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  handleDimensionChange(length, width, e.target.value);
                }}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        )}
        {dimensionsMode === false && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Volumen del Acuario (litros)
            </label>
            <input
              type="number"
              placeholder="Volumen (litros)"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        )}
        {calculatedVolume > 0 && (
          <p className="mt-4 text-lg dark:text-gray-300">
            Volumen Calculado: <strong>{calculatedVolume} litros</strong>
          </p>
        )}
        {(dimensionsMode === true || dimensionsMode === false) && (
          <button
            type="button"
            className="w-full px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800"
            onClick={() => {
              const classified = classifyFilters(calculatedVolume, filters);
              setRecommendedFilters(classified.recommended);
              setAdequateFilters(classified.adequate);
              setNotAdequateFilters(classified.notAdequate);
              setRecommendedCombinations(classified.recommendedCombinations);
              setAdequateCombinations(classified.adequateCombinations);
            }}
          >
            ¿Qué filtros me recomiendas? 🐠
          </button>
        )}
        {filters.length > 0 && (
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Actualmente, nuestra base de datos contiene datos de {filters.length} filtros. 🗄️
          </p>
        )}
        {error && <p className="text-red-500 mt-4 dark:text-red-400">{error}</p>}
        {loading && <p className="mt-4 dark:text-gray-300">Cargando filtros...</p>}
        <div className="mt-8">
          {(recommendedFilters.length > 0 || adequateFilters.length > 0 || recommendedCombinations.length > 0 || adequateCombinations.length > 0) && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer dark:text-gray-300"
                      onClick={() => requestSort('marca')}
                    >
                      Marca
                      {sortConfig.key === 'marca' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : null}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer dark:text-gray-300"
                      onClick={() => requestSort('modelo')}
                    >
                      Modelo
                      {sortConfig.key === 'modelo' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : null}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer dark:text-gray-300"
                      onClick={() => requestSort('caudal')}
                    >
                      Caudal (l/h)
                      {sortConfig.key === 'caudal' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : null}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer dark:text-gray-300"
                      onClick={() => requestSort('volumen_vaso_filtro')}
                    >
                      Volumen Vaso (l)
                      {sortConfig.key === 'volumen_vaso_filtro' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : null}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {sortedFilters.map((filter) => (
                    <tr key={filter.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {filter.marca}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {filter.modelo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {filter.caudal}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {filter.volumen_vaso_filtro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {recommendedFilters.length === 0 && adequateFilters.length === 0 && recommendedCombinations.length === 0 && adequateCombinations.length === 0 && !loading && calculatedVolume > 0 && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              No se encontraron filtros recomendados o adecuados en nuestra base de datos para este volumen de acuario. 🙁
            </p>
          )}
        </div>
      </div>
    </div>
  );
}