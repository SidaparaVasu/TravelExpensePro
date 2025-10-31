import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravelStore } from '@/src/store/travelStore';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { TripWithCategories } from '@/src/types/travel.types';
import { transformToBackend } from '@/src/utils/travelTransformers';
import { getEmptyTrip, getEmptyTicketing, getEmptyAccommodation, getEmptyConveyance } from '@/src/utils/travelInitializers';
import { travelAPI } from '@/src/api/travel';

// Component imports
import { TabNavigation } from '@/components/travel/TabNavigation';
import { TripSelector } from '@/components/travel/TripSelector';
import { BookingCategoryTabs } from '@/components/travel/BookingCategoryTabs';
import { BasicInfoForm } from '@/components/travel/BasicInfoForm';
import { TripDetailsForm } from '@/components/travel/TripDetailsForm';
import { TicketingForm } from '@/components/travel/TicketingForm';
import { AccommodationForm } from '@/components/travel/AccommodationForm';
import { ConveyanceForm } from '@/components/travel/ConveyanceForm';
import { TravelAdvanceForm } from '@/components/travel/TravelAdvanceForm';
import { ReviewPage } from '@/components/travel/ReviewPage';

export default function MakeTravelApplication() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const {
        locations,
        travelModes,
        glCodes,
        guestHouses,
        arcHotels,
        loadMasterData,
        loadGuestHouses,
        loadARCHotels,
        createApplication,
        isLoading
    } = useTravelStore();

    // State management
    const [activeTab, setActiveTab] = useState('basic');
    const [currentTripIndex, setCurrentTripIndex] = useState(0);
    const [activeCategory, setActiveCategory] = useState('ticketing');
    const [completedTabs, setCompletedTabs] = useState<string[]>([]);
    const [subOptions, setSubOptions] = useState<Record<number, any>>({});

    const [formData, setFormData] = useState({
        purpose: '',
        internal_order: '',
        general_ledger: '',
        sanction_number: '',
        advance_amount: 0,
    });

    const [trips, setTrips] = useState<TripWithCategories[]>([getEmptyTrip()]);

    // Load master data on mount
    useEffect(() => {
        loadMasterData();
        loadGuestHouses();
        loadARCHotels();
    }, []);

    // Helper functions
    const getTripLabel = (index: number) => {
        const trip = trips[index];
        if (trip.tripDetails.from_location && trip.tripDetails.to_location) {
            const from = locations?.results?.find(l => l.location_id === trip.tripDetails.from_location)?.city_name || 'Start';
            const to = locations?.results?.find(l => l.location_id === trip.tripDetails.to_location)?.city_name || 'End';
            return `${from} → ${to}`;
        }
        return `Trip ${index + 1}`;
    };

    const markTabComplete = (tab: string) => {
        if (!completedTabs.includes(tab)) {
            setCompletedTabs([...completedTabs, tab]);
        }
    };

    // Trip management
    const addTrip = () => {
        setTrips([...trips, getEmptyTrip()]);
        setCurrentTripIndex(trips.length);
        setActiveTab('trips');
    };

    const removeTrip = (index: number) => {
        if (trips.length > 1) {
            const newTrips = trips.filter((_, i) => i !== index);
            setTrips(newTrips);
            if (currentTripIndex >= newTrips.length) {
                setCurrentTripIndex(newTrips.length - 1);
            }
        }
    };

    const updateTripDetails = (index: number, field: string, value: any) => {
        const updated = [...trips];
        updated[index].tripDetails = { ...updated[index].tripDetails, [field]: value };
        setTrips(updated);
    };

    // Ticketing management
    const addTicketing = () => {
        const updated = [...trips];
        updated[currentTripIndex].ticketing.push(getEmptyTicketing());
        setTrips(updated);
    };

    const removeTicketing = (index: number) => {
        const updated = [...trips];
        updated[currentTripIndex].ticketing = updated[currentTripIndex].ticketing.filter((_, i) => i !== index);
        setTrips(updated);
    };

    const updateTicketing = (index: number, field: string, value: any) => {
        const updated = [...trips];
        updated[currentTripIndex].ticketing[index] = {
            ...updated[currentTripIndex].ticketing[index],
            [field]: value
        };
        setTrips(updated);
    };

    const loadSubOptionsForTicketing = async (modeId: number, ticketIndex: number) => {
        if (!subOptions[modeId]) {
            const options = await travelAPI.getTravelSubOptions(modeId);
            setSubOptions(prev => ({ ...prev, [modeId]: options }));
        }
    };

    // Accommodation management
    const addAccommodation = () => {
        const updated = [...trips];
        const newAcc = getEmptyAccommodation();

        // Find Hotel mode and set it
        const hotelMode = travelModes?.results?.find((m: any) => m.name === 'Hotel');
        if (hotelMode) {
            newAcc.booking_type = hotelMode.id;
        }
        // else {
        //     // Fallback: use any available mode or show error
        //     toast({
        //         title: 'Warning',
        //         description: 'Hotel travel mode not found. Please configure travel modes.',
        //         variant: 'destructive'
        //     });
        //     return;
        // }

        updated[currentTripIndex].accommodation.push(newAcc);
        setTrips(updated);
    };

    const removeAccommodation = (index: number) => {
        const updated = [...trips];
        updated[currentTripIndex].accommodation = updated[currentTripIndex].accommodation.filter((_, i) => i !== index);
        setTrips(updated);
    };

    const updateAccommodation = (index: number, field: string, value: any) => {
        const updated = [...trips];
        updated[currentTripIndex].accommodation[index] = {
            ...updated[currentTripIndex].accommodation[index],
            [field]: value
        };
        setTrips(updated);
    };

    // Conveyance management
    const addConveyance = () => {
        const updated = [...trips];
        updated[currentTripIndex].conveyance.push(getEmptyConveyance());
        setTrips(updated);
    };

    const removeConveyance = (index: number) => {
        const updated = [...trips];
        updated[currentTripIndex].conveyance = updated[currentTripIndex].conveyance.filter((_, i) => i !== index);
        setTrips(updated);
    };

    const updateConveyance = (index: number, field: string, value: any) => {
        const updated = [...trips];
        updated[currentTripIndex].conveyance[index] = {
            ...updated[currentTripIndex].conveyance[index],
            [field]: value
        };
        setTrips(updated);
    };

    const loadSubOptionsForConveyance = async (modeId: number, convIndex: number) => {
        if (!subOptions[modeId]) {
            const options = await travelAPI.getTravelSubOptions(modeId);
            setSubOptions(prev => ({ ...prev, [modeId]: options }));
        }
    };

    // Travel Advance management
    const updateTravelAdvance = (field: string, value: any) => {
        const updated = [...trips];
        updated[currentTripIndex].travelAdvance = {
            ...updated[currentTripIndex].travelAdvance,
            [field]: value
        };
        setTrips(updated);
    };

    // Review edit handler
    const handleEditFromReview = (tab: string, tripIndex?: number, category?: string) => {
        setActiveTab(tab);
        if (tripIndex !== undefined) {
            setCurrentTripIndex(tripIndex);
        }
        if (category) {
            setActiveCategory(category);
        }
    };

    // Submit handler
    // const handleSubmit = async (e?: React.FormEvent) => {
    //     if (e) e.preventDefault();

    //     try {
    //         const transformedTrips = transformToBackend(trips);

    //         const application = await createApplication({
    //             ...formData,
    //             status: "draft",
    //             general_ledger: parseInt(formData.general_ledger),
    //             trip_details: transformedTrips
    //         });

    //         toast({ title: 'Success', description: 'Travel application created successfully' });
    //         navigate(`/travel/travel-application-list`);
    //     } catch (error: any) {
    //         console.error(error);
    //         toast({
    //             title: 'Error',
    //             description: error.response?.data?.message || 'Failed to create application',
    //             variant: 'destructive',
    //         });
    //     }
    // };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Validation: Check all bookings have valid booking_type
        for (let tripIndex = 0; tripIndex < trips.length; tripIndex++) {
            const trip = trips[tripIndex];

            // Check ticketing
            for (let i = 0; i < trip.ticketing.length; i++) {
                if (!trip.ticketing[i].booking_type || trip.ticketing[i].booking_type === 0) {
                    toast({
                        title: 'Validation Error',
                        description: `Trip ${tripIndex + 1}: Please select travel mode for Ticket ${i + 1}`,
                        variant: 'destructive'
                    });
                    setActiveTab('trips');
                    setCurrentTripIndex(tripIndex);
                    setActiveCategory('ticketing');
                    return;
                }
            }

            // Check accommodation
            for (let i = 0; i < trip.accommodation.length; i++) {
                if (!trip.accommodation[i].booking_type || trip.accommodation[i].booking_type === 0) {
                    console.log(trip);
                    console.log(trip.accommodation[i]);
                    toast({
                        title: 'Validation Error',
                        description: `Trip ${tripIndex + 1}: Invalid accommodation booking type`,
                        variant: 'destructive'
                    });
                    setActiveTab('trips');
                    setCurrentTripIndex(tripIndex);
                    setActiveCategory('accommodation');
                    return;
                }
            }

            // Check conveyance
            for (let i = 0; i < trip.conveyance.length; i++) {
                if (!trip.conveyance[i].booking_type || trip.conveyance[i].booking_type === 0) {
                    toast({
                        title: 'Validation Error',
                        description: `Trip ${tripIndex + 1}: Please select vehicle type for Conveyance ${i + 1}`,
                        variant: 'destructive'
                    });
                    setActiveTab('trips');
                    setCurrentTripIndex(tripIndex);
                    setActiveCategory('conveyance');
                    return;
                }
            }
        }

        try {
            const transformedTrips = transformToBackend(trips);

            console.log('Submitting payload:', {
                ...formData,
                status: "draft",
                general_ledger: parseInt(formData.general_ledger),
                trip_details: transformedTrips
            });

            const application = await createApplication({
                ...formData,
                status: "draft",
                general_ledger: parseInt(formData.general_ledger),
                trip_details: transformedTrips
            });

            toast({ title: 'Success', description: 'Travel application created successfully' });
            navigate(`/travel/travel-application-list`);
        } catch (error: any) {
            console.error(error);

            // Better error handling
            const errorMessage = error.response?.data?.message
                || error.response?.data?.detail
                || JSON.stringify(error.response?.data || {})
                || 'Failed to create application';

            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        }
    };

    return (
        <Layout>
            <form onSubmit={handleSubmit} className="space-y-6  height: max-content">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-semibold">Create Travel Application</h1>
                </div>

                <div className="bg-white rounded-md overflow-hidden shadow-sm">
                    <TabNavigation
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        completedTabs={completedTabs}
                    />

                    <div className="p-4">
                        {activeTab === 'basic' && (
                            <BasicInfoForm
                                formData={formData}
                                onChange={(field, value) => setFormData({ ...formData, [field]: value })}
                                glCodes={glCodes}
                                onNext={() => {
                                    markTabComplete('basic');
                                    setActiveTab('trips');
                                }}
                            />
                        )}

                        {activeTab === 'trips' && (
                            <div className='space-y-6'>
                                <div className="grid grid-cols-5 min-h-screen">
                                    {/* <TripSelector
                                    trips={trips}
                                    currentTripIndex={currentTripIndex}
                                    onTripChange={setCurrentTripIndex}
                                    onAddTrip={addTrip}
                                    onRemoveTrip={removeTrip}
                                    getTripLabel={getTripLabel}
                                /> */}

                                    <BookingCategoryTabs
                                        activeCategory={activeCategory}
                                        onCategoryChange={setActiveCategory}
                                    />

                                    <div className="animate-fadeIn col-span-4 p-5">
                                        {activeCategory === 'trip_info' && (
                                            <TripDetailsForm
                                                tripDetails={trips[currentTripIndex].tripDetails}
                                                onChange={(field, value) => updateTripDetails(currentTripIndex, field, value)}
                                                locations={locations}
                                                advanceAmount={formData.advance_amount}
                                                onAdvanceAmountChange={(value) => setFormData({ ...formData, advance_amount: value })}
                                            />
                                        )}

                                        {activeCategory === 'ticketing' && (
                                            <TicketingForm
                                                ticketing={trips[currentTripIndex].ticketing}
                                                onChange={updateTicketing}
                                                onAdd={addTicketing}
                                                onRemove={removeTicketing}
                                                travelModes={travelModes}
                                                subOptions={subOptions}
                                                onModeChange={loadSubOptionsForTicketing}
                                                tripMode={trips[currentTripIndex].tripDetails.trip_mode || 'one-way'}
                                            />
                                        )}

                                        {activeCategory === 'accommodation' && (
                                            <AccommodationForm
                                                accommodation={trips[currentTripIndex].accommodation}
                                                onChange={updateAccommodation}
                                                onAdd={addAccommodation}
                                                onRemove={removeAccommodation}
                                                travelModes={travelModes}
                                                guestHouses={guestHouses}
                                                arcHotels={arcHotels}
                                            />
                                        )}

                                        {activeCategory === 'conveyance' && (
                                            <ConveyanceForm
                                                conveyance={trips[currentTripIndex].conveyance}
                                                onChange={updateConveyance}
                                                onAdd={addConveyance}
                                                onRemove={removeConveyance}
                                                travelModes={travelModes}
                                                subOptions={subOptions}
                                                onModeChange={loadSubOptionsForConveyance}
                                            />
                                        )}

                                        {activeCategory === 'advance' && (
                                            <TravelAdvanceForm
                                                travelAdvance={trips[currentTripIndex].travelAdvance}
                                                onChange={updateTravelAdvance}
                                                ticketing={trips[currentTripIndex].ticketing}
                                                accommodation={trips[currentTripIndex].accommodation}
                                                conveyance={trips[currentTripIndex].conveyance}
                                            />
                                        )}
                                    </div>

                                </div>
                                <div className="flex justify-between pt-4">
                                    <Button type="button" variant="outline" onClick={() => setActiveTab('basic')}>
                                        Previous
                                    </Button>
                                    <Button type="button" onClick={() => {
                                        markTabComplete('trips');
                                        setActiveTab('review');
                                    }}>
                                        Next: Review
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'review' && (
                            <ReviewPage
                                formData={formData}
                                trips={trips}
                                glCodes={glCodes}
                                locations={locations}
                                travelModes={travelModes}
                                guestHouses={guestHouses}
                                arcHotels={arcHotels}
                                onEdit={handleEditFromReview}
                                onSubmit={handleSubmit}
                                isLoading={isLoading}
                            />
                        )}
                    </div>
                </div>
            </form>

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
        </Layout>
    );
}