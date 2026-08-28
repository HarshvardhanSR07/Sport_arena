import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { MapPin, Users, ChevronRight, Filter, Building2 } from 'lucide-react';

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
      <div className="relative overflow-hidden rounded-3xl shadow-lg p-8 text-white mb-8 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500">
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-accent-500/20 rounded-full blur-2xl" />
        <div className="relative flex items-center">
          <div className="icon-duotone w-14 h-14 bg-white/15 mr-4">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">Sports Facilities</h1>
            <p className="text-primary-100 mt-1">Find and book your next game</p>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center space-x-4 flex-wrap gap-y-3">
          <div className="icon-duotone w-9 h-9 bg-primary-50">
            <Filter className="h-4 w-4 text-primary-600" />
          </div>
          <select
            className="input-field max-w-xs"
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
              className="card card-hover cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="icon-duotone w-14 h-14 bg-primary-50 text-3xl">
                  {sportIcons[facility.sport]}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  facility.type === 'indoor' ? 'bg-primary-50 text-primary-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {facility.type}
                </span>
              </div>

              <h3 className="text-xl font-semibold font-display mb-1 text-gray-900 group-hover:text-primary-600 transition-colors">
                {facility.name}
              </h3>

              <p className="text-sm text-gray-500 capitalize mb-3">{facility.sport.replace('-', ' ')}</p>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {facility.location}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  {facility.minParticipants} - {facility.maxParticipants} players
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Max {facility.bookingRules.maxDurationHours}h
                </span>
                <ChevronRight className="h-5 w-5 text-primary-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {filteredFacilities.length === 0 && !loading && (
        <div className="card text-center py-12">
          <div className="icon-duotone w-16 h-16 bg-gray-50 mx-auto mb-3">
            <Building2 className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500">No facilities match your filters</p>
        </div>
      )}
    </div>
  );
};

export default FacilityList;