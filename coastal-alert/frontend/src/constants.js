// Indian coastal states and union territories
export const COASTAL_REGIONS = [
  // West Coast
  { value: 'Gujarat', label: 'Gujarat', coast: 'West' },
  { value: 'Maharashtra', label: 'Maharashtra', coast: 'West' },
  { value: 'Goa', label: 'Goa', coast: 'West' },
  { value: 'Karnataka', label: 'Karnataka', coast: 'West' },
  { value: 'Kerala', label: 'Kerala', coast: 'West' },
  
  // East Coast
  { value: 'Tamil Nadu', label: 'Tamil Nadu', coast: 'East' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh', coast: 'East' },
  { value: 'Odisha', label: 'Odisha', coast: 'East' },
  { value: 'West Bengal', label: 'West Bengal', coast: 'East' },
  
  // Union Territories
  { value: 'Daman and Diu', label: 'Daman and Diu', coast: 'West' },
  { value: 'Dadra and Nagar Haveli', label: 'Dadra and Nagar Haveli', coast: 'West' },
  { value: 'Puducherry', label: 'Puducherry', coast: 'East' },
  { value: 'Andaman and Nicobar', label: 'Andaman and Nicobar Islands', coast: 'Bay of Bengal' },
  { value: 'Lakshadweep', label: 'Lakshadweep', coast: 'Arabian Sea' }
];

// Major coastal cities for more specific locations
export const MAJOR_COASTAL_CITIES = {
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhidham', 'Porbandar', 'Veraval'],
  'Maharashtra': ['Mumbai', 'Navi Mumbai', 'Thane', 'Pune', 'Nashik', 'Ratnagiri', 'Sindhudurg', 'Palghar', 'Raigad'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Karnataka': ['Mangalore', 'Udupi', 'Karwar', 'Kundapura', 'Bhatkal'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur', 'Kannur', 'Alappuzha'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Thoothukudi', 'Kanyakumari', 'Cuddalore', 'Nagapattinam'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kakinada', 'Srikakulam', 'Machilipatnam'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Puri', 'Paradip', 'Balasore', 'Gopalpur'],
  'West Bengal': ['Kolkata', 'Howrah', 'Digha', 'Haldia', 'Diamond Harbour', 'Sagar Island'],
  'Daman and Diu': ['Daman', 'Diu'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Yanam', 'Mahe'],
  'Andaman and Nicobar': ['Port Blair', 'Havelock Island', 'Neil Island'],
  'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy']
};