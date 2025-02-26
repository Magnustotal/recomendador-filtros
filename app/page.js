'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicializa el cliente de Supabase (fuera del componente, para que sea global)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function Home() {
  // Estados para los datos del acuario
  const [dimensionsMode, setDimensionsMode] = useState(true); // true: dimensiones, false: volumen directo
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [volume, setVolume] = useState('');
  const [calculatedVolume, setCalculatedVolume] = useState(0);

  // Estado para los filtros (aquí guardaremos los datos de Supabase)
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(false); // Para mostrar un indicador de carga
  const [error, setError] = useState(null);   // Para mostrar errores

    // Estados para las listas de filtros clasificados
    const [recommendedFilters, setRecommendedFilters] = useState([]);
    const [adequateFilters, setAdequateFilters] = useState([]);
    const [notAdequateFilters, setNotAdequateFilters] = useState([]);

  // Función para calcular el volumen (si se usan dimensiones)
  const calculateVolume = () => {
    if (dimensionsMode && length && width && height) {
      const vol = (length * width * height) / 1000;
      setCalculatedVolume(vol);
      // También actualizamos el estado 'volume' para unificar el manejo
      setVolume(vol);
    }
  };

  // useEffect para cargar los filtros desde Supabase (se ejecutará al inicio)
    useEffect(() => {
    const fetchFilters = async () => {
      setLoading(true);
      setError(null);

      try {
        // Ejemplo de consulta a Supabase (¡ADÁPTALO A TU TABLA!)
        const { data, error } = await supabase
          .from('filtros') // Reemplaza 'filtros' con el nombre de tu tabla
          .select('*');     // Selecciona todas las columnas

        if (error) {
          throw error;
        }
        setFilters(data || []); // Guarda los filtros en el estado
      } catch (err) {
        setError(err.message || 'Error al cargar los filtros');
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []); // El array vacío [] asegura que se ejecute solo una vez al montar el componente

    // Función para clasificar los filtros
    const classifyFilters = (aquariumVolume, filtersData) => {
    if (!aquariumVolume || filtersData.length === 0) {
      return { recommended: [], adequate: [], notAdequate: [] };
    }

    const recommended = [];
    const adequate = [];
    const notAdequate = [];

    // Caudal mínimo requerido (x10)
    const minFlowRate = aquariumVolume * 10;

    filtersData.forEach((filter) => {
      const caudal = filter.caudal;
      const vol_filtrante = filter.volumen_vaso_real;

      if (caudal < minFlowRate) {
        notAdequate.push(filter);
        return; // Pasa al siguiente filtro
      }

      //Calculamos el 90% del volumen filtrante.
      const ninetyPercentFilteringVolume = vol_filtrante * 0.9;

      // Filtro ADECUADO
      if (caudal >= minFlowRate && ninetyPercentFilteringVolume >= aquariumVolume * 0.025) {
          adequate.push(filter);
      }

      // Filtro RECOMENDADO
      if(caudal >= minFlowRate && ninetyPercentFilteringVolume >= aquariumVolume * 0.05){
          recommended.push(filter);
      }

      //Acuarios de más de 200 litros, combinaciones de filtros
      if (aquariumVolume > 200){
        filtersData.forEach((filter2) => {

          const combinedCaudal = filter.caudal + filter2.caudal;
          const combinedVolFiltrante = filter.volumen_vaso_real + filter2.volumen_vaso_real;

          //Si son el mismo modelo
          if(filter.modelo === filter2.modelo){
            //Si la combinación de caudal es superior al minimo y 90% volumen filtrante combinado es superior al 2.5% del acuario
            if(combinedCaudal >= minFlowRate && (combinedVolFiltrante*0.9) >= aquariumVolume * 0.025){
              //Añadimos la combinacion como adecuada
              adequate.push({
                modelo: `${filter.modelo} x2`, // Nombre combinado
                caudal: combinedCaudal,
                volumen_vaso_real: combinedVolFiltrante,
                // ... otras propiedades combinadas si las necesitas ...
              });
            }
            //Si la combinación de caudal es superior al minimo y 90% volumen filtrante combinado es superior al 5% del acuario
            if(combinedCaudal >= minFlowRate && (combinedVolFiltrante*0.9) >= aquariumVolume * 0.05){
              //Añadimos la combinacion como recomendada
              recommended.push({
                modelo: `${filter.modelo} x2`, // Nombre combinado
                caudal: combinedCaudal,
                volumen_vaso_real: combinedVolFiltrante,
                 // ... otras propiedades combinadas si las necesitas ...
              });
            }
          }
        });
      }
    });

    return { recommended, adequate, notAdequate };
  };


  // --- INTERFAZ DE USUARIO ---
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-4">Recomendador de Filtros</h1>
      <p className="text-center text-lg mb-8">
        Encuentra el filtro perfecto para tu acuario de agua dulce.
      </p>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Selector de Modo de Ingreso */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ¿Cómo quieres ingresar los datos?
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                dimensionsMode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setDimensionsMode(true)}
            >
              Dimensiones
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                !dimensionsMode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setDimensionsMode(false)}
            >
              Volumen Directo
            </button>
          </div>
        </div>

        {/* Formulario de Entrada (Condicional) */}
        {dimensionsMode ? (
          // Formulario para Dimensiones
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dimensiones del Acuario (cm)
            </label>
            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Largo"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Ancho"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Alto"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
                type="button"
                onClick={calculateVolume}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Calcular Volumen
            </button>
          </div>
        ) : (
          // Formulario para Volumen Directo
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volumen del Acuario (litros)
            </label>
            <input
              type="number"
              placeholder="Volumen (litros)"
              value={volume}
              onChange={(e) => {
                setVolume(e.target.value);
                setCalculatedVolume(e.target.value); // Actualiza calculatedVolume
              }}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Botón de Obtener Recomendaciones */}
        <button
          type="button"
          className="w-full px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={() => {
            const classified = classifyFilters(calculatedVolume, filters);
            setRecommendedFilters(classified.recommended);
            setAdequateFilters(classified.adequate);
            setNotAdequateFilters(classified.notAdequate);

          }}
        >
          Obtener Recomendaciones
        </button>


        {/* Mostrar el volumen calculado (opcional, para depuración) */}
        {calculatedVolume > 0 && (
          <p className="mt-4 text-lg">
            Volumen Calculado: <strong>{calculatedVolume} litros</strong>
          </p>
        )}

        {/* Mostrar errores (si los hay) */}
        {error && <p className="text-red-500 mt-4">{error}</p>}

        {/* Mostrar indicador de carga (mientras se obtienen los datos) */}
        {loading && <p className="mt-4">Cargando filtros...</p>}

        {/* Listas de Filtros (Acordeones) */}
        <div className="mt-8">
          {/* Recomendados */}
          {recommendedFilters.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Filtros Recomendados</h2>
              <ul className="border rounded-md">
                {recommendedFilters.map((filter) => (
                  <li key={filter.id} className="border-b last:border-b-0 p-2">
                    {filter.modelo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Adecuados */}
          {adequateFilters.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Filtros Adecuados</h2>
              <ul className="border rounded-md">
                {adequateFilters.map((filter) => (
                  <li key={filter.id} className="border-b last:border-b-0 p-2">
                    {filter.modelo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No Adecuados */}
          {notAdequateFilters.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Filtros No Adecuados</h2>
              <ul className="border rounded-md">
                {notAdequateFilters.map((filter) => (
                  <li key={filter.id} className="border-b last:border-b-0 p-2">
                    {filter.modelo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}