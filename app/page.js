// app/page.js

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-4">Recomendador de Filtros</h1>
      <p className="text-center text-lg mb-8">
        Encuentra el filtro perfecto para tu acuario de agua dulce.
      </p>

      {/* Contenedor para el formulario */}
      <div className="bg-white rounded-lg shadow-md p-6">
          {/* Aquí irá el formulario más adelante */}
          <p className="text-gray-600">
            Por favor, ingresa las dimensiones de tu acuario o el volumen en litros.
          </p>
      </div>
    </div>
  );
}