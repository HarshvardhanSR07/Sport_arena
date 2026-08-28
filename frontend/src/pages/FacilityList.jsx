import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { MapPin, Users, ChevronRight, Filter } from 'lucide-react';

const FacilityList = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    sport: 'all'
  });

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await API.get('/facilities');
      setFacilities(response.data.facilities);
    } catch (error) {
      console.error('Failed to fetch facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFacilities = facilities.filter(f => {
    if (filter.type !== 'all' && f.type !== filter.type) return false;
    if (filter.sport !== 'all' && f.sport !== filter.sport) return false;
    return true;
  });

  const sportIcons = {
    badminton: '🏸',
    tennis: '🎾',
    football: '⚽',
    basketball: '🏀',
    cricket: '🏏',
    volleyball: '🏐',
    'table-tennis': '🏓',
    squash: '🎯',
    swimming: '🏊',
    athletics: '🏃'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sports Facilities</h1>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4 flex-wrap">
          <Filter className="h-5 w-5 text-gray-500" />
          <select            className="input-field max-w-xs"
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          >
            <option value="all">All Types</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
          </select>

          <select
            className="input-field max-w-xs"
            value={filter.sport}
            onChange={(e) => setFilter({ ...filter, sport: e.target.value })}
          >
            <option value="all">All Sports</option>
            <option value="badminton">Badminton</option>
            <option value="tennis">Tennis</option>
            <option value="football">Football</option>
            <option value="basketball">Basketball</option>
            <option value="table-tennis">Table Tennis</option>
            <option value="swimming">Swimming</option>
          </select>
        </div>
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((facility) => (
            <Link
              key={facility._id}
              to={`/book/${facility._id}`}
              className="card hover:shadow-lg transition cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="text-4xl">{sportIcons[facility.sport]}</div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  facility.type === 'indoor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {facility.type}
                </span>
              </div>

              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-600">
                {facility.name}
              </h3>

              <p className="text-sm text-gray-600 capitalize mb-3">{facility.sport.replace('-', ' ')}</p>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {facility.location}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {facility.minParticipants} - {facility.maxParticipants} players
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Max {facility.bookingRules.maxDurationHours}h
                </span>
                <ChevronRight className="h-5 w-5 text-primary-600 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {filteredFacilities.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No facilities match your filters</p>
        </div>
      )}
    </div>
  );
};

export default FacilityList;

