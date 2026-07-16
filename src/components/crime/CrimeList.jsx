function CrimeList() {
  return (
    <div className="p-4 flex flex-row text-white-600 ">
      <h2 className="text-lg font-semibold">Nearby Reports</h2>

      <div className="mt-3 space-y-3">
        <div className="p-3 bg-grey shadow rounded text-white">
          Theft reported 2km away
        </div>
        <div className="p-43 bg-white shadow rounded">
          Robbery reported 4km away
        </div>
      </div>
    </div>
  );
}

export default CrimeList;
