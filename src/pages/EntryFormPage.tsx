import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../styles/EntryForm.css';

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


const EntryFormPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, control, reset } = useForm({
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
  const [submissionStatus, setSubmissionStatus] = useState<'success' | 'error' | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState('');


  const onSubmit = async (data) => {
    setSubmissionStatus(null);
    setSubmissionMessage('');
    try {
      const response = await fetch('/.netlify/functions/submit-to-formspree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmissionStatus('success');
        setSubmissionMessage('Thank you for your submission!');
        reset();
      } else {
        setSubmissionStatus('error');
        setSubmissionMessage('Form submission failed. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmissionStatus('error');
      setSubmissionMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="entry-form-page">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Referral Code */}
        <div className="mb-3 position-relative">
          <label htmlFor="referral-code" className="form-label">
            Referral Code <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="referral-code"
            {...register("referralCode", { required: "Referral code is required." })}
            placeholder="Enter referral code"
            aria-required="true"
          />
          {errors.referralCode && <div className="invalid-feedback d-block">{errors.referralCode.message}</div>}
        </div>

        {/* Full Name */}
        <div className="mb-3 position-relative">
          <label htmlFor="full-name" className="form-label">
            Full Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="full-name"
            {...register("fullName", { required: "Full name is required." })}
            aria-required="true"
          />
          {errors.fullName && <div className="invalid-feedback d-block">{errors.fullName.message}</div>}
        </div>

        {/* Email */}
        <div className="mb-3 position-relative">
          <label htmlFor="email" className="form-label">Email <span className="text-danger">*</span></label>
          <input
            type="email"
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            id="email"
            {...register("email", {
              required: "Email is required.",
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: "Email is not valid."
              }
            })}
            aria-required="true"
            aria-describedby="email-error"
          />
          {errors.email && <div id="email-error" className="invalid-feedback d-block">{errors.email.message}</div>}
        </div>

        {/* Zangi ID (optional) */}
        <div className="mb-3 position-relative">
          <label htmlFor="zangi-id" className="form-label">Zangi ID</label>
          <input
            type="text"
            className="form-control"
            id="zangi-id"
            {...register("zangiId")}
            placeholder="Enter your Zangi ID (optional)"
          />
        </div>

        {/* Phone Number */}
        <div className="mb-3 position-relative">
          <label htmlFor="phone" className="form-label">
            Phone Number <span className="text-danger">*</span>
          </label>
          <Controller
            name="phone"
            control={control}
            rules={{
              required: "Phone number is required.",
              validate: value => isValidPhoneNumber(value || '') || "Phone number is not valid."
            }}
            render={({ field }) => (
              <PhoneInput
                {...field}
                id="phone"
                placeholder="Enter phone number"
                className={errors.phone ? 'is-invalid' : ''}
                international
                withCountryCallingCode
              />
            )}
          />
          {errors.phone && <div className="invalid-feedback d-block">{errors.phone.message}</div>}
        </div>

        {/* Address */}
        <div className="mb-3" id="address-section">
          <label className="form-label">
            Address <span className="text-danger">*</span>
          </label>
          <div id="address-fields">
            <input
              type="text"
              className="form-control mb-2"
              id="address-line1"
              {...register("addressLine1", { required: "Address line 1 is required." })}
              placeholder="Address Line 1"
            />
            {errors.addressLine1 && <div className="invalid-feedback d-block">{errors.addressLine1.message}</div>}
            <input
              type="text"
              className="form-control mb-2"
              id="address-line2"
              {...register("addressLine2")}
              placeholder="Address Line 2"
            />
            <input
              type="text"
              className="form-control mb-2"
              id="city"
              {...register("city", { required: "City is required." })}
              placeholder="City"
            />
            {errors.city && <div className="invalid-feedback d-block">{errors.city.message}</div>}
            <input
              type="text"
              className="form-control mb-2"
              id="state"
              {...register("state")}
              placeholder="State/Province"
            />
            <input
              type="text"
              className={`form-control mb-2 ${errors.postalCode ? 'is-invalid' : ''}`}
              id="postal-code"
              {...register("postalCode", { required: "Postal code is required." })}
              placeholder="Postal Code"
            />
            {errors.postalCode && <div className="invalid-feedback d-block">{errors.postalCode.message}</div>}
            <div className="form-check mb-3 mailing-checkbox">
              <input className="form-check-input" type="checkbox" id="use-as-mailing-address" {...register("useAsMailingAddress")} />
              <label className="form-check-label" htmlFor="use-as-mailing-address">Use this address for mailing/delivery</label>
            </div>
          </div>
        </div>

        {/* Country */}
        <div className="mb-3">
          <label htmlFor="country-select" className="form-label">
            Country <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            id="country-select"
            {...register("country", { required: "Country is required." })}
          >
            <option value="" disabled>
              Select Country
            </option>
            {countries.map(country => (
              <option key={country.value} value={country.value}>{country.label}</option>
            ))}
          </select>
          {errors.country && <div className="invalid-feedback d-block">{errors.country.message}</div>}
        </div>

        {/* Date of Birth */}
        <div className="mb-3 position-relative">
          <label htmlFor="dob" className="form-label">
            Date of Birth <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            className={`form-control ${errors.dob ? 'is-invalid' : ''}`}
            id="dob"
            {...register("dob", { required: "Date of birth is required." })}
            aria-required="true"
            aria-describedby="dob-error"
            min="1900-01-01"
            max="2012-06-21"
          />
          {errors.dob && <div id="dob-error" className="invalid-feedback d-block">{errors.dob.message}</div>}
        </div>

        {/* Gender */}
        <div className="mb-3">
          <label htmlFor="gender" className="form-label">
            Gender <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            id="gender"
            {...register("gender", { required: "Gender is required." })}
            aria-required="true"
          >
            <option value="" disabled>Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer Not to Say">
              Prefer Not to Say
            </option>
          </select>
          {errors.gender && <div className="invalid-feedback d-block">{errors.gender.message}</div>}
        </div>

        {/* Fan-To-Artist Preferences */}
        <div className="mb-3 position-relative">
          <label htmlFor="branch" className="form-label">
            Fan-To-Artist Preferences
            <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            id="branch"
            {...register("fanPreferenceBranch", { required: "This field is required." })}
            aria-required="true"
          >
            <option value="" disabled>
              Select a HYBE Branch
            </option>
            {hybeBranches.map(branch => (
              <option key={branch.value} value={branch.value}>{branch.label}</option>
            ))}
          </select>
          {errors.fanPreferenceBranch && <div className="invalid-feedback d-block">{errors.fanPreferenceBranch.message}</div>}
        </div>

        {/* Favorite Group */}
        <div className="mb-3 position-relative">
          <label htmlFor="group" className="form-label">
            Select Your Favorite Group
            <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            id="group"
            {...register("favoriteGroup", { required: "This field is required." })}
            aria-required="true"
          >
            <option value="" disabled>Select a Group</option>
            {favoriteGroups.map(group => (
              <option key={group.value} value={group.value}>{group.label}</option>
            ))}
          </select>
          {errors.favoriteGroup && <div className="invalid-feedback d-block">{errors.favoriteGroup.message}</div>}
        </div>

        {/* Favorite Artist */}
        <div className="mb-3 position-relative">
          <label htmlFor="artist" className="form-label">
            Select Your Favorite Artist(s)
            <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            id="artist"
            {...register("favoriteArtist", { required: "This field is required." })}
            aria-required="true"
          >
            <option value="" disabled>
              Select an Artist
            </option>
            {favoriteArtists.map(artist => (
              <option key={artist.value} value={artist.value}>{artist.label}</option>
            ))}
          </select>
          {errors.favoriteArtist && <div className="invalid-feedback d-block">{errors.favoriteArtist.message}</div>}
        </div>

        {/* Giveaway Information */}
        <div className="mb-3">
          <h3 className="h5">About the HYBE Mega Giveaway</h3>
          <p className="text-muted mb-2">
            This is an official HYBE initiative to celebrate BTS's upcoming concerts and engage with our global fan community. Every fan has an equal and fair chance of being selected. Our system is designed to protect all participants, ensuring a safe and authentic fan-to-artist connection. Winners are selected randomly, and the process is monitored for fairness and transparency.
          </p>
        </div>

        {submissionStatus && (
          <div className={`alert alert-${submissionStatus === 'success' ? 'success' : 'danger'} mt-3`}>
            {submissionMessage}
          </div>
        )}

        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Entry'}
        </button>
      </form>
    </div>
  );
};

export default EntryFormPage;
