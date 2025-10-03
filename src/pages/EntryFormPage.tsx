import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../styles/EntryForm.css';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import { getLocalSession, requestOtp, verifyOtp as verifyOtpFn, saveLocalSession, issueFormNonce } from '../utils/auth';

// HYBE hierarchy: Branch -> Group -> Artists
const HYBE_STRUCTURE: Record<string, { label: string; groups: Record<string, { label: string; artists: string[] }> }> = {
  BIGHIT: {
    label: 'BIGHIT MUSIC',
    groups: {
      BTS: {
        label: 'BTS',
        artists: ['RM', 'Jin', 'Suga', 'J-Hope', 'Jimin', 'V', 'Jungkook'],
      },
      TXT: {
        label: 'Tomorrow X Together',
        artists: ['Yeonjun', 'Soobin', 'Beomgyu', 'Taehyun', 'Hueningkai'],
      },
    },
  },
  PLEDIS: {
    label: 'PLEDIS Entertainment',
    groups: {
      SEVENTEEN: {
        label: 'SEVENTEEN',
        artists: [
          'S.Coups', 'Jeonghan', 'Joshua', 'Jun', 'Hoshi', 'Wonwoo', 'Woozi', 'The8', 'Mingyu', 'DK', 'Seungkwan', 'Vernon', 'Dino',
        ],
      },
      fromis_9: {
        label: 'fromis_9',
        artists: ['Saerom', 'Hayoung', 'Jiwon', 'Jisun', 'Seoyeon', 'Chaeyoung', 'Nagyung', 'Jiheon'],
      },
    },
  },
  SOURCEMUSIC: {
    label: 'SOURCE MUSIC',
    groups: {
      'LE SSERAFIM': {
        label: 'LE SSERAFIM',
        artists: ['Sakura', 'Kim Chaewon', 'Huh Yunjin', 'Kazuha', 'Hong Eunchae'],
      },
    },
  },
  BELIFTLAB: {
    label: 'BELIFT LAB',
    groups: {
      ENHYPEN: {
        label: 'ENHYPEN',
        artists: ['Heeseung', 'Jay', 'Jake', 'Sunghoon', 'Sunoo', 'Jungwon', 'Ni-ki'],
      },
    },
  },
  ADOR: {
    label: 'ADOR',
    groups: {
      NewJeans: {
        label: 'NewJeans',
        artists: ['Minji', 'Hanni', 'Danielle', 'Haerin', 'Hyein'],
      },
    },
  },
};

// Minimal fallback list used only if the countries API is unavailable
const fallbackCountries: { code: string; name: string }[] = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
];

const RESEND_COOLDOWN_SECONDS = 30;

const EntryFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string>('');
  const [countryOptions, setCountryOptions] = useState<{ code: string; name: string }[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);

  // Preview + OTP modal flow state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpShake, setOtpShake] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [resendIn, setResendIn] = useState(0);

  const { register, handleSubmit, formState: { errors, isSubmitting }, control, setError, setValue, watch } = useForm({
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
      consentTerms: false,
      consentPrivacy: false,
    }
  });

  const watchedCountry = watch('country');
  const selectedBranch = watch('fanPreferenceBranch');
  const selectedGroup = watch('favoriteGroup');

  // Load session and pre-fill email if available (do not require login)
  useEffect(() => {
    const s = getLocalSession();
    if (s && s.email) {
      setSessionEmail(s.email);
      setValue('email', s.email, { shouldValidate: true });
    }
  }, [setValue]);

  // Safe fetch wrapper to avoid crashes from third-party fetch wrappers (FullStory etc.).
  // Falls back to XMLHttpRequest if fetch fails or is wrapped and throws synchronously.
  async function safeFetch(input: RequestInfo, init?: RequestInit) {
    try {
      const res = await (fetch as any)(input, init);
      return res;
    } catch (e) {
      console.warn('[safeFetch] network error or fetch wrapper failure for', input, e);
      // Fallback to XMLHttpRequest-based implementation to avoid reliance on window.fetch wrappers
      try {
        return await new Promise<Response>((resolve, reject) => {
          try {
            const xhr = new XMLHttpRequest();
            const method = (init && init.method) ? init.method.toUpperCase() : 'GET';
            const url = String(input);
            xhr.open(method, url, true);

            // Set headers if provided
            if (init && init.headers) {
              const headers = init.headers as Record<string, string> | Headers;
              if (headers instanceof Headers) {
                headers.forEach((value, key) => xhr.setRequestHeader(key, value));
              } else {
                Object.entries(headers as Record<string, string>).forEach(([k, v]) => xhr.setRequestHeader(k, v));
              }
            }

            xhr.onreadystatechange = () => {
              if (xhr.readyState !== 4) return;
              const status = xhr.status || 0;
              const ok = status >= 200 && status < 300;

              const shim: Partial<Response> = {
                ok,
                status,
                statusText: xhr.statusText,
                url: url,
                text: async () => xhr.responseText,
                json: async () => {
                  try {
                    return JSON.parse(xhr.responseText || 'null');
                  } catch (err) {
                    throw err;
                  }
                }
              };

              resolve(shim as unknown as Response);
            };

            xhr.onerror = () => reject(new TypeError('Network request failed'));

            // Send body for methods like POST
            if (init && init.body != null) {
              xhr.send(init.body as any);
            } else {
              xhr.send();
            }
          } catch (err) {
            reject(err);
          }
        });
      } catch (xhrErr) {
        console.warn('[safeFetch] XHR fallback failed for', input, xhrErr);
        return null as unknown as Response;
      }
    }
  }

  // Fetch global country list from REST Countries API for robust worldwide support
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await safeFetch('https://restcountries.com/v3.1/all?fields=cca2,name');
        if (!res || !res.ok) throw new Error('Failed to load countries');
        const data: { cca2: string; name: { common: string } }[] = await res.json();
        const opts = data
          .map(d => ({ code: d.cca2.toUpperCase(), name: d.name.common }))
          .filter(d => d.code.length === 2 && d.name)
          .sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setCountryOptions(opts);
      } catch (err) {
        if (!cancelled) setCountryOptions(fallbackCountries);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Detect user country by IP and preselect for both phone formatting and address country
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await safeFetch('https://ipapi.co/json/');
        if (!res || !res.ok) throw new Error('Failed to geo-detect');
        const info: any = await res.json();
        const code: string | undefined = (info && (info.country_code || info.country)) ? String(info.country_code || info.country).toUpperCase() : undefined;
        if (!cancelled && code && /^[A-Z]{2}$/.test(code)) {
          setSelectedCountry(code);
          setValue('country', code, { shouldValidate: true, shouldDirty: true });
        }
      } catch (err) {
        // Silent fallback: keep defaults
      }
    })();
    return () => { cancelled = true; };
  }, [setValue]);

  // Auto-refresh once when route loader hides to ensure full form responsiveness
  useEffect(() => {
    const onHidden = () => {
      if (sessionStorage.getItem('entry_auto_refreshed')) return;
      sessionStorage.setItem('entry_auto_refreshed', '1');
      setTimeout(() => {
        window.location.reload();
      }, 0);
    };
    window.addEventListener('route-loader-hidden', onHidden);
    return () => {
      window.removeEventListener('route-loader-hidden', onHidden);
    };
  }, []);

  // Keep phone input formatting in sync with the selected address country
  useEffect(() => {
    if (watchedCountry && watchedCountry !== selectedCountry) {
      setSelectedCountry(watchedCountry);
    }
  }, [watchedCountry, selectedCountry]);

  // Resend cooldown countdown
  useEffect(() => {
    if (!otpOpen || resendIn <= 0) return;
    const t = setInterval(() => setResendIn(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [otpOpen, resendIn]);

  // Derived options for cascading selects
  const branchOptions = useMemo(() => (
    Object.entries(HYBE_STRUCTURE).map(([value, meta]) => ({ value, label: meta.label }))
  ), []);

  const groupOptions = useMemo(() => {
    if (!selectedBranch) return [] as { value: string; label: string }[];
    const groups = HYBE_STRUCTURE[selectedBranch]?.groups || {};
    return Object.entries(groups).map(([value, meta]) => ({ value, label: meta.label }));
  }, [selectedBranch]);

  const artistOptions = useMemo(() => {
    if (!selectedBranch || !selectedGroup) return [] as { value: string; label: string }[];
    const artists = HYBE_STRUCTURE[selectedBranch]?.groups?.[selectedGroup]?.artists || [];
    return artists.map((a) => ({ value: a, label: a }));
  }, [selectedBranch, selectedGroup]);

  // Reset dependent fields when parents change
  useEffect(() => {
    setValue('favoriteGroup', '');
    setValue('favoriteArtist', '');
  }, [selectedBranch, setValue]);

  useEffect(() => {
    setValue('favoriteArtist', '');
  }, [selectedGroup, setValue]);

  const countrySelectOptions = useMemo(() => (
    [<option key="_placeholder" value="" disabled>Select Country</option>,
     ...countryOptions.map(c => (
       <option key={c.code} value={c.code}>{c.name}</option>
     ))]
  ), [countryOptions]);

  function toUrlEncoded(data: Record<string, any>) {
    return Object.keys(data)
      .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key] ?? ''))
      .join('&');
  }

  async function submitEntryToNetlify(payload: Record<string, any>) {
    try {
      const body = toUrlEncoded({ 'form-name': 'entry', ...payload });
      const response = await safeFetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!response || !response.ok) {
        setSubmissionError('Form submit failed. Please try again.');
        return;
      }
      navigate('/entry/success');
    } catch (err) {
      console.error('Submission Error:', err);
      setSubmissionError('A network error occurred. Please try again later.');
    }
  }

  const onSubmit = async (data: any) => {
    setSubmissionError(null);

    // Build Netlify Forms payload using field names matching index.html hidden form
    const payload: Record<string, any> = {
      referralCode: data.referralCode?.trim() || '',
      fullName: data.fullName?.trim() || '',
      dob: data.dob || '',
      gender: data.gender || '',
      email: (sessionEmail || data.email || '').trim(),
      phone: data.phone || '',
      zangiId: data.zangiId?.trim() || '',
      addressLine1: data.addressLine1?.trim() || '',
      addressLine2: data.addressLine2?.trim() || '',
      city: data.city?.trim() || '',
      state: data.state?.trim() || '',
      postalCode: data.postalCode?.trim() || '',
      country: data.country || '',
      useAsMailingAddress: data.useAsMailingAddress ? 'true' : 'false',
      fanPreferenceBranch: data.fanPreferenceBranch || '',
      favoriteGroup: data.favoriteGroup || '',
      favoriteArtist: data.favoriteArtist || '',
      consentTerms: data.consentTerms ? 'true' : 'false',
      consentPrivacy: data.consentPrivacy ? 'true' : 'false',
    };

    // Always show preview first, then send OTP on confirm
    setPendingPayload(payload);
    setPendingEmail(payload.email);
    setPreviewError(null);
    setPreviewOpen(true);
  };

  useEffect(() => {
    const code = otpCode.trim();
    if (!otpOpen) return;
    if (code.length === 6 && /^\d{6}$/.test(code) && !isVerifying) {
      verifyAndSubmit();
    }
  }, [otpCode, otpOpen]);

  const verifyAndSubmit = async () => {
    if (!pendingEmail || !pendingPayload || isVerifying) return;
    setIsVerifying(true);
    setOtpError(null);
    setOtpVerified(false);
    try {
      const token = await verifyOtpFn(pendingEmail, otpCode.trim(), 'login');
      setOtpVerified(true);
      await new Promise(r => setTimeout(r, 350));
      saveLocalSession(token);
      setSessionEmail(pendingEmail);
      const nonce = await issueFormNonce();
      const ts = Date.now().toString();
      await submitEntryToNetlify({ ...pendingPayload, supabase_nonce: nonce, ts });
      setOtpOpen(false);
    } catch (e: any) {
      setOtpVerified(false);
      const msg = e?.message || 'Please enter the 6-digit OTP sent to your email.';
      setOtpError(msg);
      setOtpShake(true);
      setTimeout(() => setOtpShake(false), 500);
    } finally {
      setIsVerifying(false);
    }
  };

  const resendCode = async () => {
    if (!pendingEmail || resendIn > 0) return;
    try {
      await requestOtp(pendingEmail, 'login');
      setOtpError(null);
      setResendIn(RESEND_COOLDOWN_SECONDS);
    } catch (e: any) {
      setOtpError(e?.message || 'Failed to resend code');
    }
  };

  const closeOtp = () => {
    if (isVerifying) return;
    setOtpOpen(false);
    setOtpCode('');
    setOtpError(null);
    setOtpVerified(false);
    setResendIn(0);
  };

  return (
    <>
      <Navbar />
      <div className="entry-form-page container mt-5">
        <h1 className="text-center mb-4">Giveaway Entry Form</h1>
        <form name="entry" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" name="form-name" value="entry" />
          <input type="hidden" name="bot-field" value="" />
          <div className="row">
            {/* Personal Information Section */}
            <div className="col-md-6 mb-4">
              <fieldset className="border p-3 h-100">
                <legend className="w-auto h5">Personal Information</legend>
                <div className="mb-3">
                  <label htmlFor="referral-code" className="form-label">Referral Code</label>
                  <input type="text" id="referral-code" className={`form-control ${errors.referralCode ? 'is-invalid' : ''}`} {...register('referralCode')} placeholder="(Optional)" />
                  {errors.referralCode && <div className="invalid-feedback">{errors.referralCode.message}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="full-name" className="form-label">Full Name <span className="text-danger">*</span></label>
                  <input type="text" id="full-name" className={`form-control ${errors.fullName ? 'is-invalid' : ''}`} {...register('fullName', { required: 'Full name is required.' })} />
                  {errors.fullName && <div className="invalid-feedback">{errors.fullName.message}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="dob" className="form-label">Date of Birth <span className="text-danger">*</span></label>
                  <input type="date" id="dob" className={`form-control ${errors.dob ? 'is-invalid' : ''}`} {...register('dob', { required: 'Date of birth is required.' })} min="1900-01-01" max="2012-06-21" />
                  {errors.dob && <div className="invalid-feedback">{errors.dob.message}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="gender" className="form-label">Gender <span className="text-danger">*</span></label>
                  <select id="gender" className={`form-select ${errors.gender ? 'is-invalid' : ''}`} {...register('gender', { required: 'Gender is required.' })}>
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
                  <input
                    type="email"
                    id="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    {...register('email', {
                      required: 'Email is required.',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address.' }
                    })}
                    readOnly={!!sessionEmail}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">Phone Number <span className="text-danger">*</span></label>
                  <Controller
                    name="phone"
                    control={control}
                    rules={{
                      required: 'Phone number is required.',
                      validate: (value) => isValidPhoneNumber(value || '') || 'Invalid phone number.'
                    }}
                    render={({ field }) => (
                      <PhoneInput
                        {...field}
                        id="phone"
                        className={errors.phone ? 'is-invalid' : ''}
                        international
                        withCountryCallingCode
                        limitMaxLength
                        country={selectedCountry as any}
                        defaultCountry={selectedCountry as any}
                      />
                    )}
                  />
                  {errors.phone && <div className="invalid-feedback d-block">{errors.phone.message}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="zangi-id" className="form-label">Zangi ID</label>
                  <input type="text" id="zangi-id" className="form-control" {...register('zangiId')} placeholder="(Optional)" />
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
                    <input type="text" id="address-line1" className={`form-control ${errors.addressLine1 ? 'is-invalid' : ''}`} {...register('addressLine1', { required: 'Address line 1 is required.' })} />
                    {errors.addressLine1 && <div className="invalid-feedback">{errors.addressLine1.message}</div>}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="address-line2" className="form-label">Address Line 2</label>
                    <input type="text" id="address-line2" className="form-control" {...register('addressLine2')} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="city" className="form-label">City <span className="text-danger">*</span></label>
                    <input type="text" id="city" className={`form-control ${errors.city ? 'is-invalid' : ''}`} {...register('city', { required: 'City is required.' })} />
                    {errors.city && <div className="invalid-feedback">{errors.city.message}</div>}
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="state" className="form-label">State / Province / Region</label>
                    <input type="text" id="state" className="form-control" {...register('state')} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="postal-code" className="form-label">ZIP / Postal Code <span className="text-danger">*</span></label>
                    <input type="text" id="postal-code" className={`form-control ${errors.postalCode ? 'is-invalid' : ''}`} {...register('postalCode', { required: 'Postal code is required.' })} />
                    {errors.postalCode && <div className="invalid-feedback">{errors.postalCode.message}</div>}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="country-select" className="form-label">Country <span className="text-danger">*</span></label>
                    <select
                      id="country-select"
                      className={`form-select ${errors.country ? 'is-invalid' : ''}`}
                      {...register('country', { required: 'Country is required.' })}
                    >
                      {countrySelectOptions}
                    </select>
                    {errors.country && <div className="invalid-feedback">{errors.country.message}</div>}
                  </div>
                  <div className="col-12">
                    <div className="form-check">
                      <input type="checkbox" id="use-as-mailing-address" className="form-check-input" {...register('useAsMailingAddress')} />
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
                    <select
                      id="branch"
                      className={`form-select ${errors.fanPreferenceBranch ? 'is-invalid' : ''}`}
                      {...register('fanPreferenceBranch', { required: 'This field is required.' })}
                    >
                      <option value="" disabled>Select a Branch</option>
                      {branchOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                    {errors.fanPreferenceBranch && <div className="invalid-feedback">{errors.fanPreferenceBranch.message}</div>}
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="group" className="form-label">Favorite Group <span className="text-danger">*</span></label>
                    <select
                      id="group"
                      className={`form-select ${errors.favoriteGroup ? 'is-invalid' : ''}`}
                      aria-disabled={!selectedBranch}
                      disabled={!selectedBranch}
                      {...register('favoriteGroup', {
                        validate: (v) => !selectedBranch || v ? true : 'This field is required.'
                      })}
                    >
                      <option value="" disabled>{selectedBranch ? 'Select a Group' : 'Select a Branch first'}</option>
                      {groupOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                    {errors.favoriteGroup && <div className="invalid-feedback">{String(errors.favoriteGroup.message)}</div>}
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="artist" className="form-label">Favorite Artist <span className="text-danger">*</span></label>
                    <select
                      id="artist"
                      className={`form-select ${errors.favoriteArtist ? 'is-invalid' : ''}`}
                      aria-disabled={!selectedGroup}
                      disabled={!selectedBranch || !selectedGroup}
                      {...register('favoriteArtist', {
                        validate: (v) => !selectedGroup ? true : (v ? true : 'This field is required.')
                      })}
                    >
                      <option value="" disabled>{selectedGroup ? 'Select an Artist' : 'Select a Group first'}</option>
                      {artistOptions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                    {errors.favoriteArtist && <div className="invalid-feedback">{String(errors.favoriteArtist.message)}</div>}
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Consents */}
            <div className="col-12 mb-4">
              <fieldset className="border p-3">
                <legend className="w-auto h5">Consents</legend>
                <div className="form-check mb-2">
                  <input type="checkbox" id="consent-terms" className="form-check-input" {...register('consentTerms', { required: 'You must accept the Terms and Conditions.' })} />
                  <label htmlFor="consent-terms" className="form-check-label">I agree to the Terms and Conditions</label>
                  {errors.consentTerms && <div className="text-danger small mt-1">{String(errors.consentTerms.message)}</div>}
                </div>
                <div className="form-check">
                  <input type="checkbox" id="consent-privacy" className="form-check-input" {...register('consentPrivacy', { required: 'You must accept the Privacy Policy.' })} />
                  <label htmlFor="consent-privacy" className="form-check-label">I agree to the Privacy Policy</label>
                  {errors.consentPrivacy && <div className="text-danger small mt-1">{String(errors.consentPrivacy.message)}</div>}
                </div>
              </fieldset>
            </div>
          </div>

          {/* Submission Area */}
          <div className="text-center">
            {submissionError && <div className="alert alert-danger" role="alert">{submissionError}</div>}
            <div className="mb-3">
              <h3 className="h5">About the HYBE Mega Giveaway</h3>
              <p className="text-muted">
                This official HYBE initiative celebrates our artists and engages with our global fan community. The selection process is random and monitored for fairness.
              </p>
            </div>
            <button type="submit" className="button-primary btn-lg" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Entry'}
            </button>
          </div>
        </form>
      </div>

      {/* OTP Modal */}
      {otpOpen && (
        <div className="modal-overlay" onClick={closeOtp}>
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="otp-heading" onClick={e => e.stopPropagation()}>
            <p className="modal-title-label">Email verification</p>
            <h2 id="otp-heading">Confirm your email</h2>
            <p>We sent a 6‑digit code to <strong>{pendingEmail}</strong>. Enter it below to verify and submit your entry.</p>
            <div className="otp-input-row">
              <input
                id="otp-code"
                className={`form-control ${otpError ? 'is-invalid' : ''} ${otpVerified ? 'otp-success' : ''}`}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                onPaste={(e) => {
                  e.preventDefault();
                  const text = (e.clipboardData || (window as any).clipboardData).getData('text');
                  const digits = String(text || '').replace(/[^\d]/g, '').slice(0, 6);
                  if (digits) setOtpCode(digits);
                }}
                inputMode="numeric"
                pattern="\\d*"
                maxLength={6}
                aria-invalid={!!otpError}
                aria-describedby={otpError ? 'otp-code-error' : undefined}
                autoFocus
              />
              {(isVerifying || otpVerified) && (
                <div className="otp-trailing" aria-hidden="true">
                  {otpVerified ? <div className="otp-check" aria-hidden="true" /> : <div className="loading-spinner" />}
                </div>
              )}
            </div>
            {otpError && <div id="otp-code-error" className="invalid-feedback d-block">{otpError}</div>}
            <div className="button-row mt-14">
              <button type="button" className="button-secondary" onClick={resendCode} disabled={isVerifying || resendIn > 0}>{resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}</button>
              <button type="button" className="button-secondary" onClick={closeOtp} disabled={isVerifying}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default EntryFormPage;
