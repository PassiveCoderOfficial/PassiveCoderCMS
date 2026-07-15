// Bangladesh districts → police stations / upazilas (for cascading dropdowns).
// Metro districts (Dhaka, Chattogram, Khulna, Rajshahi…) include city thanas.

export const BD_LOCATIONS: Record<string, string[]> = {
  // ── Dhaka division ──────────────────────────────────────────────────────
  "Dhaka": ["Adabor","Badda","Banani","Bangshal","Bhashantek","Cantonment","Chawkbazar","Dakshinkhan","Darus Salam","Demra","Dhamrai","Dhanmondi","Dohar","Gendaria","Gulshan","Hatirjheel","Hazaribagh","Jatrabari","Kadamtali","Kafrul","Kalabagan","Kamrangirchar","Keraniganj","Khilgaon","Khilkhet","Kotwali","Lalbagh","Mirpur","Mohammadpur","Motijheel","Mugda","Nawabganj","New Market","Pallabi","Paltan","Ramna","Rampura","Sabujbagh","Savar","Shah Ali","Shahbagh","Shahjahanpur","Sher-e-Bangla Nagar","Shyampur","Sutrapur","Tejgaon","Turag","Uttara East","Uttara West","Uttarkhan","Vatara","Wari"],
  "Faridpur": ["Alfadanga","Bhanga","Boalmari","Charbhadrasan","Faridpur Sadar","Madhukhali","Nagarkanda","Sadarpur","Saltha"],
  "Gazipur": ["Gazipur Sadar","Kaliakair","Kaliganj","Kapasia","Sreepur","Tongi"],
  "Gopalganj": ["Gopalganj Sadar","Kashiani","Kotalipara","Muksudpur","Tungipara"],
  "Kishoreganj": ["Austagram","Bajitpur","Bhairab","Hossainpur","Itna","Karimganj","Katiadi","Kishoreganj Sadar","Kuliarchar","Mithamain","Nikli","Pakundia","Tarail"],
  "Madaripur": ["Kalkini","Madaripur Sadar","Rajoir","Shibchar","Dasar"],
  "Manikganj": ["Daulatpur","Ghior","Harirampur","Manikganj Sadar","Saturia","Shivalaya","Singair"],
  "Munshiganj": ["Gazaria","Lohajang","Munshiganj Sadar","Sirajdikhan","Sreenagar","Tongibari"],
  "Narayanganj": ["Araihazar","Bandar","Fatullah","Narayanganj Sadar","Rupganj","Siddhirganj","Sonargaon"],
  "Narsingdi": ["Belabo","Monohardi","Narsingdi Sadar","Palash","Raipura","Shibpur"],
  "Rajbari": ["Baliakandi","Goalandaghat","Kalukhali","Pangsha","Rajbari Sadar"],
  "Shariatpur": ["Bhedarganj","Damudya","Gosairhat","Naria","Shariatpur Sadar","Zajira"],
  "Tangail": ["Basail","Bhuapur","Delduar","Dhanbari","Ghatail","Gopalpur","Kalihati","Madhupur","Mirzapur","Nagarpur","Sakhipur","Tangail Sadar"],

  // ── Chattogram division ─────────────────────────────────────────────────
  "Chattogram": ["Akbarshah","Anwara","Bakalia","Bandar","Banshkhali","Bayezid Bostami","Boalkhali","Chandanaish","Chandgaon","Chawkbazar (Ctg)","Double Mooring","EPZ","Fatikchhari","Halishahar","Hathazari","Karnaphuli","Khulshi","Kotwali (Ctg)","Lohagara","Mirsharai","Pahartali","Panchlaish","Patenga","Patiya","Rangunia","Raozan","Sandwip","Satkania","Sitakunda"],
  "Bandarban": ["Alikadam","Bandarban Sadar","Lama","Naikhongchhari","Rowangchhari","Ruma","Thanchi"],
  "Brahmanbaria": ["Akhaura","Ashuganj","Bancharampur","Bijoynagar","Brahmanbaria Sadar","Kasba","Nabinagar","Nasirnagar","Sarail"],
  "Chandpur": ["Chandpur Sadar","Faridganj","Haimchar","Haziganj","Kachua","Matlab Dakshin","Matlab Uttar","Shahrasti"],
  "Cox's Bazar": ["Chakaria","Cox's Bazar Sadar","Eidgaon","Kutubdia","Maheshkhali","Pekua","Ramu","Teknaf","Ukhia"],
  "Cumilla": ["Barura","Brahmanpara","Burichang","Chandina","Chauddagram","Cumilla Adarsha Sadar","Cumilla Sadar Dakshin","Daudkandi","Debidwar","Homna","Laksam","Lalmai","Meghna","Monohorgonj","Muradnagar","Nangalkot","Titas"],
  "Feni": ["Chhagalnaiya","Daganbhuiyan","Feni Sadar","Fulgazi","Parshuram","Sonagazi"],
  "Khagrachhari": ["Dighinala","Guimara","Khagrachhari Sadar","Lakshmichhari","Mahalchhari","Manikchhari","Matiranga","Panchhari","Ramgarh"],
  "Lakshmipur": ["Kamalnagar","Lakshmipur Sadar","Raipur","Ramganj","Ramgati"],
  "Noakhali": ["Begumganj","Chatkhil","Companiganj","Hatiya","Kabirhat","Noakhali Sadar","Senbagh","Sonaimuri","Subarnachar"],
  "Rangamati": ["Baghaichhari","Barkal","Belaichhari","Juraichhari","Kaptai","Kawkhali","Langadu","Naniarchar","Rajasthali","Rangamati Sadar"],

  // ── Rajshahi division ───────────────────────────────────────────────────
  "Rajshahi": ["Bagha","Bagmara","Boalia","Charghat","Durgapur (Raj)","Godagari","Matihar","Mohanpur","Paba","Puthia","Rajpara","Shah Makhdum","Tanore"],
  "Bogura": ["Adamdighi","Bogura Sadar","Dhunat","Dhupchanchia","Gabtali","Kahaloo","Nandigram","Sariakandi","Shajahanpur","Sherpur (Bogura)","Shibganj (Bogura)","Sonatala"],
  "Chapainawabganj": ["Bholahat","Chapainawabganj Sadar","Gomastapur","Nachole","Shibganj"],
  "Joypurhat": ["Akkelpur","Joypurhat Sadar","Kalai","Khetlal","Panchbibi"],
  "Naogaon": ["Atrai","Badalgachhi","Dhamoirhat","Manda","Mahadebpur","Naogaon Sadar","Niamatpur","Patnitala","Porsha","Raninagar","Sapahar"],
  "Natore": ["Bagatipara","Baraigram","Gurudaspur","Lalpur","Naldanga","Natore Sadar","Singra"],
  "Pabna": ["Atgharia","Bera","Bhangura","Chatmohar","Faridpur (Pabna)","Ishwardi","Pabna Sadar","Santhia","Sujanagar"],
  "Sirajganj": ["Belkuchi","Chauhali","Kamarkhanda","Kazipur","Raiganj","Shahjadpur","Sirajganj Sadar","Tarash","Ullahpara"],

  // ── Khulna division ─────────────────────────────────────────────────────
  "Khulna": ["Batiaghata","Dacope","Daulatpur (Khulna)","Dighalia","Dumuria","Khalishpur","Khan Jahan Ali","Khulna Sadar","Koyra","Paikgachha","Phultala","Rupsha","Sonadanga","Terokhada"],
  "Bagerhat": ["Bagerhat Sadar","Chitalmari","Fakirhat","Kachua (Bagerhat)","Mollahat","Mongla","Morrelganj","Rampal","Sarankhola"],
  "Chuadanga": ["Alamdanga","Chuadanga Sadar","Damurhuda","Jibannagar"],
  "Jashore": ["Abhaynagar","Bagherpara","Chaugachha","Jhikargachha","Jashore Sadar","Keshabpur","Manirampur","Sharsha"],
  "Jhenaidah": ["Harinakunda","Jhenaidah Sadar","Kaliganj (Jhenaidah)","Kotchandpur","Maheshpur","Shailkupa"],
  "Kushtia": ["Bheramara","Daulatpur (Kushtia)","Khoksa","Kumarkhali","Kushtia Sadar","Mirpur (Kushtia)"],
  "Magura": ["Magura Sadar","Mohammadpur (Magura)","Shalikha","Sreepur (Magura)"],
  "Meherpur": ["Gangni","Meherpur Sadar","Mujibnagar"],
  "Narail": ["Kalia","Lohagara (Narail)","Narail Sadar"],
  "Satkhira": ["Assasuni","Debhata","Kalaroa","Kaliganj (Satkhira)","Satkhira Sadar","Shyamnagar","Tala"],

  // ── Barishal division ───────────────────────────────────────────────────
  "Barishal": ["Agailjhara","Babuganj","Bakerganj","Banaripara","Barishal Sadar","Gaurnadi","Hizla","Mehendiganj","Muladi","Wazirpur"],
  "Barguna": ["Amtali","Bamna","Barguna Sadar","Betagi","Patharghata","Taltali"],
  "Bhola": ["Bhola Sadar","Burhanuddin","Char Fasson","Daulatkhan","Lalmohan","Manpura","Tazumuddin"],
  "Jhalokati": ["Jhalokati Sadar","Kathalia","Nalchity","Rajapur"],
  "Patuakhali": ["Bauphal","Dashmina","Dumki","Galachipa","Kalapara","Mirzaganj","Patuakhali Sadar","Rangabali"],
  "Pirojpur": ["Bhandaria","Kawkhali (Pirojpur)","Mathbaria","Nazirpur","Nesarabad","Pirojpur Sadar","Zianagar"],

  // ── Sylhet division ─────────────────────────────────────────────────────
  "Sylhet": ["Balaganj","Beanibazar","Bishwanath","Companiganj (Sylhet)","Dakshin Surma","Fenchuganj","Golapganj","Gowainghat","Jaintiapur","Kanaighat","Osmani Nagar","Sylhet Sadar","Zakiganj"],
  "Habiganj": ["Ajmiriganj","Bahubal","Baniyachong","Chunarughat","Habiganj Sadar","Lakhai","Madhabpur","Nabiganj","Shayestaganj"],
  "Moulvibazar": ["Barlekha","Juri","Kamalganj","Kulaura","Moulvibazar Sadar","Rajnagar","Sreemangal"],
  "Sunamganj": ["Bishwambarpur","Chhatak","Derai","Dharampasha","Dowarabazar","Jagannathpur","Jamalganj","Madhyanagar","Shantiganj","Sullah","Sunamganj Sadar","Tahirpur"],

  // ── Rangpur division ────────────────────────────────────────────────────
  "Rangpur": ["Badarganj","Gangachara","Kaunia","Mithapukur","Pirgachha","Pirganj (Rangpur)","Rangpur Sadar","Taraganj"],
  "Dinajpur": ["Birampur","Birganj","Biral","Bochaganj","Chirirbandar","Dinajpur Sadar","Fulbari","Ghoraghat","Hakimpur","Kaharole","Khansama","Nawabganj (Dinajpur)","Parbatipur"],
  "Gaibandha": ["Fulchhari","Gaibandha Sadar","Gobindaganj","Palashbari","Sadullapur","Saghata","Sundarganj"],
  "Kurigram": ["Bhurungamari","Char Rajibpur","Chilmari","Fulbari (Kurigram)","Kurigram Sadar","Nageshwari","Rajarhat","Raomari","Ulipur"],
  "Lalmonirhat": ["Aditmari","Hatibandha","Kaliganj (Lalmonirhat)","Lalmonirhat Sadar","Patgram"],
  "Nilphamari": ["Dimla","Domar","Jaldhaka","Kishoreganj (Nilphamari)","Nilphamari Sadar","Saidpur"],
  "Panchagarh": ["Atwari","Boda","Debiganj","Panchagarh Sadar","Tetulia"],
  "Thakurgaon": ["Baliadangi","Haripur","Pirganj (Thakurgaon)","Ranisankail","Thakurgaon Sadar"],

  // ── Mymensingh division ─────────────────────────────────────────────────
  "Mymensingh": ["Bhaluka","Dhobaura","Fulbaria","Gafargaon","Gauripur","Haluaghat","Ishwarganj","Muktagachha","Mymensingh Sadar","Nandail","Phulpur","Tarakanda","Trishal"],
  "Jamalpur": ["Baksiganj","Dewanganj","Islampur","Jamalpur Sadar","Madarganj","Melandaha","Sarishabari"],
  "Netrokona": ["Atpara","Barhatta","Durgapur (Netrokona)","Kalmakanda","Kendua","Khaliajuri","Madan","Mohanganj","Netrokona Sadar","Purbadhala"],
  "Sherpur": ["Jhenaigati","Nakla","Nalitabari","Sherpur Sadar","Sreebardi"],
};

export const BD_DISTRICTS = Object.keys(BD_LOCATIONS).sort();

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const RELIGIONS = ["muslim", "hindu", "christian", "buddhist", "other"] as const;
export const GENDERS = ["male", "female", "other"] as const;
