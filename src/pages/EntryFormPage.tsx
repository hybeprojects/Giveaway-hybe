import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../styles/EntryForm.css';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';

// Data arrays for form fields
const countries = [
  { value: 'USA', label: 'United States' },
  { value: 'GBR', label: 'United Kingdom' },
  { value: 'KOR', label: 'South Korea' },
  { value: 'JPN', label: 'Japan' },
  { value: 'CAN', label: 'Canada' },
  { value: 'DEU', label: 'Germany' },
  { value: 'AUS', label: 'Australia' },
];

const hybeBranches = [
  { value: 'BIGHIT', label: 'BIGHIT MUSIC' },
  { value: 'PLEDIS', label: 'PLEDIS Entertainment' },
  { value: 'SOURCEMUSIC', label: 'SOURCE MUSIC' },
  { value: 'BELIFTLAB', label: 'BELIFT LAB' },
  { value: 'ADOR', label: 'ADOR' },
];

const favoriteGroups = [
  { value: 'BTS', label: 'BTS' },
  { value: 'TXT', label: 'Tomorrow X Together' },
  { value: 'ENHYPEN', label: 'ENHYPEN' },
  { value: 'SEVENTEEN', label: 'SEVENTEEN' },
  { value: 'fromis_9', label: 'fromis_9' },
  { value: 'LE SSERAFIM', label: 'LE SSERAFIM' },
  { value: 'NewJeans', label: 'NewJeans' },
];

const favoriteArtists = [
  { value: 'RM', label: 'RM' },
  { value: 'Jin', label: 'Jin' },
  { value: 'Suga', label: 'Suga' },
  { value: 'J-Hope', label: 'J-Hope' },
  { value: 'Jimin', label: 'Jimin' },
  { value: 'V', label: 'V' },
  { value: 'Jungkook', label: 'Jungkook' },
];

const EntryFormPage: React.FC = () => {
  const { register, formState: { errors }, control } = useForm({
    defaultValues: {
      referralCode: '',
      fullName: '',
      email: '',
      zangiId: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      useAsMailingAddress: false,
      country: '',
      dob: '',
      gender: '',
      fanPreferenceBranch: '',
      favoriteGroup: '',
      favoriteArtist: '',
    }
  });

  return (
    <>
      <Navbar />
      <div className="entry-form-page container mt-5">
        <h1 className="text-center mb-4">Giveaway Entry Form</h1>
        <form name="entry" data-netlify="true" method="POST">
          <input type="hidden" name="form-name" value="entry" />
          <div className="row">
            {/* Personal Information Section */}
            <div className="col-md-6 mb-4">
            <fieldset className="border p-3 h-100">
              <legend className="w-auto h5">Personal Information</legend>
              <div className="mb-3">
                <label htmlFor="referral-code" className="form-label">Referral Code</label>
                <input type="text" id="referral-code" className={`form-control ${errors.referralCode ? 'is-invalid' : ''}`} {...register("referralCode")} placeholder="(Optional)" />
                {errors.referralCode && <div className="invalid-feedback">{errors.referralCode.message}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="full-name" className="form-label">Full Name <span className="text-danger">*</span></label>
                <input type="text" id="full-name" className={`form-control ${errors.fullName ? 'is-invalid' : ''}`} {...register("fullName", { required: "Full name is required." })} />
                {errors.fullName && <div className="invalid-feedback">{errors.fullName.message}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="dob" className="form-label">Date of Birth <span className="text-danger">*</span></label>
                <input type="date" id="dob" className={`form-control ${errors.dob ? 'is-invalid' : ''}`} {...register("dob", { required: "Date of birth is required." })} min="1900-01-01" max="2012-06-21" />
                {errors.dob && <div className="invalid-feedback">{errors.dob.message}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="gender" className="form-label">Gender <span className="text-danger">*</span></label>
                <select id="gender" className={`form-select ${errors.gender ? 'is-invalid' : ''}`} {...register("gender", { required: "Gender is required." })}>
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer Not to Say">Prefer Not to Say</option>
                </select>
                {errors.gender && <div className="invalid-feedback">{errors.gender.message}</div>}
              </div>
            </fieldset>
          </div>

          {/* Contact Information Section */}
          <div className="col-md-6 mb-4">
            <fieldset className="border p-3 h-100">
              <legend className="w-auto h5">Contact Information</legend>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email <span className="text-danger">*</span></label>
                <input type="email" id="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} {...register("email", { required: "Email is required.", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email address." } })} />
                {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="phone" className="form-label">Phone Number <span className="text-danger">*</span></label>
                <Controller name="phone" control={control} rules={{ required: "Phone number is required.", validate: value => isValidPhoneNumber(value || '') || "Invalid phone number." }} render={({ field }) => <PhoneInput {...field} id="phone" className={errors.phone ? 'is-invalid' : ''} international withCountryCallingCode />} />
                {errors.phone && <div className="invalid-feedback d-block">{errors.phone.message}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="zangi-id" className="form-label">Zangi ID</label>
                <input type="text" id="zangi-id" className="form-control" {...register("zangiId")} placeholder="(Optional)" />
              </div>
            </fieldset>
          </div>

          {/* Address Section */}
          <div className="col-12 mb-4">
            <fieldset className="border p-3">
              <legend className="w-auto h5">Shipping Address</legend>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="address-line1" className="form-label">Address Line 1 <span className="text-danger">*</span></label>
                  <input type="text" id="address-line1" className={`form-control ${errors.addressLine1 ? 'is-invalid' : ''}`} {...register("addressLine1", { required: "Address line 1 is required." })} />
                  {errors.addressLine1 && <div className="invalid-feedback">{errors.addressLine1.message}</div>}
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="address-line2" className="form-label">Address Line 2</label>
                  <input type="text" id="address-line2" className="form-control" {...register("addressLine2")} />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="city" className="form-label">City <span className="text-danger">*</span></label>
                  <input type="text" id="city" className={`form-control ${errors.city ? 'is-invalid' : ''}`} {...register("city", { required: "City is required." })} />
                  {errors.city && <div className="invalid-feedback">{errors.city.message}</div>}
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="state" className="form-label">State/Province</label>
                  <input type="text" id="state" className="form-control" {...register("state")} />
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="postal-code" className="form-label">Postal Code <span className="text-danger">*</span></label>
                  <input type="text" id="postal-code" className={`form-control ${errors.postalCode ? 'is-invalid' : ''}`} {...register("postalCode", { required: "Postal code is required." })} />
                  {errors.postalCode && <div className="invalid-feedback">{errors.postalCode.message}</div>}
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="country-select" className="form-label">Country <span className="text-danger">*</span></label>
                  <select id="country-select" className={`form-select ${errors.country ? 'is-invalid' : ''}`} {...register("country", { required: "Country is required." })}>
                    <option value="" disabled>Select Country</option>
                    {countries.map(country => <option key={country.value} value={country.value}>{country.label}</option>)}
                  </select>
                  {errors.country && <div className="invalid-feedback">{errors.country.message}</div>}
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input type="checkbox" id="use-as-mailing-address" className="form-check-input" {...register("useAsMailingAddress")} />
                    <label htmlFor="use-as-mailing-address" className="form-check-label">Use this address for mailing/delivery</label>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Fan Preferences Section */}
          <div className="col-12 mb-4">
            <fieldset className="border p-3">
              <legend className="w-auto h5">Fan Preferences</legend>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="branch" className="form-label">Favorite HYBE Branch <span className="text-danger">*</span></label>
                  <select id="branch" className={`form-select ${errors.fanPreferenceBranch ? 'is-invalid' : ''}`} {...register("fanPreferenceBranch", { required: "This field is required." })}>
                    <option value="" disabled>Select a Branch</option>
                    {hybeBranches.map(branch => <option key={branch.value} value={branch.value}>{branch.label}</option>)}
                  </select>
                  {errors.fanPreferenceBranch && <div className="invalid-feedback">{errors.fanPreferenceBranch.message}</div>}
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="group" className="form-label">Favorite Group <span className="text-danger">*</span></label>
                  <select id="group" className={`form-select ${errors.favoriteGroup ? 'is-invalid' : ''}`} {...register("favoriteGroup", { required: "This field is required." })}>
                    <option value="" disabled>Select a Group</option>
                    {favoriteGroups.map(group => <option key={group.value} value={group.value}>{group.label}</option>)}
                  </select>
                  {errors.favoriteGroup && <div className="invalid-feedback">{errors.favoriteGroup.message}</div>}
                </div>
                <div className="col-md-4 mb-3">
                  <label htmlFor="artist" className="form-label">Favorite Artist <span className="text-danger">*</span></label>
                  <select id="artist" className={`form-select ${errors.favoriteArtist ? 'is-invalid' : ''}`} {...register("favoriteArtist", { required: "This field is required." })}>
                    <option value="" disabled>Select an Artist</option>
                    {favoriteArtists.map(artist => <option key={artist.value} value={artist.value}>{artist.label}</option>)}
                  </select>
                  {errors.favoriteArtist && <div className="invalid-feedback">{errors.favoriteArtist.message}</div>}
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Submission Area */}
        <div className="text-center">
          <div className="mb-3">
            <h3 className="h5">About the HYBE Mega Giveaway</h3>
            <p className="text-muted">
              This official HYBE initiative celebrates our artists and engages with our global fan community. The selection process is random and monitored for fairness.
            </p>
          </div>
          <button type="submit" className="button-primary">
            Submit Entry
          </button>
        </div>
      </form>
    </div>
    <Footer />
    </>
  );
};

export default EntryFormPage;
