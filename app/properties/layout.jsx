// Deliberately no robots override here -- this used to blanket
// noindex/nofollow over the whole /properties/* tree (including
// /properties/listing/[token], the ~2200 indexable listing pages),
// silently overriding every per-page generateMetadata's robots default.
// Private subpages (add/sell/saved/[id]/edit) set their own noindex.
const PropertiesLayout = ({ children }) => children;

export default PropertiesLayout;
